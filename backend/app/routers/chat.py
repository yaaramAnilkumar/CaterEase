from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.menu import Dish, Category
import time
import json

router = APIRouter(prefix="/chat", tags=["chat"])

_sessions: dict[str, list] = {}

# Simple TTL cache for menu tool results (menu rarely changes)
_tool_cache: dict[str, tuple[float, str]] = {}
_CACHE_TTL = 300  # 5 minutes

def _cache_get(key: str) -> str | None:
    if key in _tool_cache:
        ts, val = _tool_cache[key]
        if time.time() - ts < _CACHE_TTL:
            return val
    return None

def _cache_set(key: str, val: str) -> None:
    _tool_cache[key] = (time.time(), val)

SYSTEM_PROMPT = """
You are CaterEase AI — a friendly, knowledgeable sales assistant for CaterEase, a premium catering service in Bangalore and Tirupati.

Your goal is to help customers choose the right service, understand pricing, and place an order. Be warm, concise, and proactive.

You have the following capabilities via tools — USE THEM:
- add_to_cart: You CAN directly add dishes to the customer's cart. When a customer asks to add any dish, always use this tool immediately. Never say you cannot add items.
- get_menu: Fetch live dish data from the database.
- get_categories: Get available menu categories.
- calculate_quote: Compute price estimates.

Always use your tools to get live data — never make up dish names, prices, or availability.
Always start your reply on a new line after any introductory sentence. Never join two sentences without a line break between them.

=== SERVICES ===
- Meal Box (10+ guests): Individual compartmentalized boxes. Great for corporate events.
- Delivery Box (10–120 guests): Bulk sealed boxes, best per-head price, same-day delivery available. Most popular.
- Full Catering (50+ guests): Live counters, chafing dishes, dedicated staff, full setup & teardown.

=== PRICING MULTIPLIERS ===
- Delivery Box: base price
- Meal Box: base × 1.15
- Full Catering: base × 1.40
- 5% discount automatically applied for 50+ guests

=== BOOKING LEAD TIMES ===
- Small events: minimum 7 days
- Weddings: minimum 15 days
- Peak season (Oct–Feb): minimum 30 days

=== HOW TO ORDER ===
Browse /menu → add dishes → choose service → set guest count & date → pay via Razorpay

Website: https://cater-ease-delta.vercel.app
Free quote: https://cater-ease-delta.vercel.app/get-quote
""".strip()

TOOLS = [
    {
        "name": "add_to_cart",
        "description": "Add one or more dishes to the customer's cart. Use when the customer asks to add, order, or select specific dishes. Search by dish name — partial matches are fine.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dishes": {
                    "type": "array",
                    "description": "List of dishes to add.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name":     {"type": "string",  "description": "Dish name or partial name to search for."},
                            "quantity": {"type": "integer", "description": "How many to add. Defaults to 1.", "default": 1},
                        },
                        "required": ["name"],
                    },
                },
            },
            "required": ["dishes"],
        },
    },
    {
        "name": "get_menu",
        "description": "Fetch available dishes from the live menu. Filter by category name, dietary preference, or popularity. Use this whenever a customer asks about food options, specific dishes, or what's available.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Category name to filter by. One of: Starters, Main Course, Breads, Rice & Biryani, Desserts, Beverages. Omit for all.",
                },
                "dietary": {
                    "type": "string",
                    "enum": ["veg", "non-veg", "jain", "vegan", "gluten-free"],
                    "description": "Dietary filter. Omit for no filter.",
                },
                "popular_only": {
                    "type": "boolean",
                    "description": "If true, return only popular/recommended dishes.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_categories",
        "description": "Get all available menu categories. Use when customer asks about what types of food are available.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "calculate_quote",
        "description": "Calculate an estimated price range for an event based on guest count, service type, and selected dish categories. Use when customer asks for pricing, cost estimate, or a quote.",
        "input_schema": {
            "type": "object",
            "properties": {
                "guests": {
                    "type": "integer",
                    "description": "Number of guests.",
                },
                "service_type": {
                    "type": "string",
                    "enum": ["meal_box", "delivery_box", "full_catering"],
                    "description": "Type of catering service.",
                },
                "categories": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of dish categories to include, e.g. ['Starters', 'Main Course', 'Breads']. Omit to use all categories.",
                },
            },
            "required": ["guests", "service_type"],
        },
    },
]

CATEGORY_PRICE_RANGES = {
    "Starters":       (25, 55),
    "Main Course":    (40, 80),
    "Breads":         (15, 25),
    "Rice & Biryani": (35, 65),
    "Desserts":       (25, 45),
    "Beverages":      (25, 30),
}

SERVICE_MULTIPLIERS = {
    "meal_box":      1.15,
    "delivery_box":  1.0,
    "full_catering": 1.40,
}

SERVICE_LABELS = {
    "meal_box":      "Meal Box",
    "delivery_box":  "Delivery Box",
    "full_catering": "Full Catering",
}


def _dish_to_dict(d: Dish) -> dict:
    return {
        "id": d.id, "name": d.name, "description": d.description or "",
        "price_per_head": d.price_per_head,
        "category": {"id": d.category.id, "name": d.category.name, "display_order": d.category.display_order, "is_active": d.category.is_active} if d.category else {"id": 0, "name": "", "display_order": 0, "is_active": True},
        "is_veg": d.is_veg, "is_jain": d.is_jain, "is_vegan": d.is_vegan,
        "is_gluten_free": d.is_gluten_free, "image_url": d.image_url,
        "is_available": d.is_available, "is_popular": d.is_popular,
        "avg_rating": None, "review_count": 0,
    }


def _execute_add_to_cart(inputs: dict, db: Session) -> tuple[str, list[dict]]:
    """Returns (message_for_claude, [{dish, quantity}, ...])"""
    from sqlalchemy import func as sqlfunc
    items = inputs.get("dishes", [])
    found, not_found = [], []

    for item in items:
        name = item.get("name", "").strip()
        qty  = max(1, int(item.get("quantity", 1)))
        dish = (
            db.query(Dish)
            .filter(Dish.is_available == True, Dish.name.ilike(f"%{name}%"))
            .first()
        )
        if dish:
            found.append({"dish": _dish_to_dict(dish), "quantity": qty})
        else:
            not_found.append(name)

    parts = []
    if found:
        names = ", ".join(f"{f['dish']['name']} ×{f['quantity']} (₹{f['dish']['price_per_head']}/head)" for f in found)
        parts.append(f"Added to cart: {names}.")
    if not_found:
        parts.append(f"Could not find: {', '.join(not_found)}. Please check the name.")

    return " ".join(parts), found


def _execute_tool(name: str, inputs: dict, db: Session) -> str:
    if name == "add_to_cart":
        msg, _ = _execute_add_to_cart(inputs, db)
        return msg

    if name == "get_categories":
        cached = _cache_get("categories")
        if cached:
            return cached
        cats = db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()
        result = f"Available categories: {', '.join(c.name for c in cats)}"
        _cache_set("categories", result)
        return result

    if name == "get_menu":
        cache_key = f"menu:{inputs.get('category','')}:{inputs.get('dietary','')}:{inputs.get('popular_only','')}"
        cached = _cache_get(cache_key)
        if cached:
            return cached

        q = db.query(Dish).filter(Dish.is_available == True)

        if inputs.get("category"):
            cat = db.query(Category).filter(Category.name.ilike(inputs["category"])).first()
            if cat:
                q = q.filter(Dish.category_id == cat.id)

        dietary = inputs.get("dietary", "")
        if dietary == "veg":           q = q.filter(Dish.is_veg == True)
        elif dietary == "non-veg":     q = q.filter(Dish.is_veg == False)
        elif dietary == "jain":        q = q.filter(Dish.is_jain == True)
        elif dietary == "vegan":       q = q.filter(Dish.is_vegan == True)
        elif dietary == "gluten-free": q = q.filter(Dish.is_gluten_free == True)

        if inputs.get("popular_only"):
            q = q.filter(Dish.is_popular == True)

        dishes = q.all()
        if not dishes:
            return "No dishes found for that filter."

        lines = []
        for d in dishes:
            tags = []
            if d.is_veg:         tags.append("Veg")
            if d.is_jain:        tags.append("Jain")
            if d.is_vegan:       tags.append("Vegan")
            if d.is_gluten_free: tags.append("GF")
            if d.is_popular:     tags.append("⭐ Popular")
            tag_str = f" [{', '.join(tags)}]" if tags else ""
            lines.append(f"- {d.name}: ₹{d.price_per_head}/head{tag_str} — {d.description or ''}")

        result = "\n".join(lines)
        _cache_set(cache_key, result)
        return result

    if name == "calculate_quote":
        guests   = inputs["guests"]
        service  = inputs["service_type"]
        cats     = inputs.get("categories") or list(CATEGORY_PRICE_RANGES.keys())
        mult     = SERVICE_MULTIPLIERS.get(service, 1.0)
        discount = 0.95 if guests >= 50 else 1.0

        raw_min = sum(CATEGORY_PRICE_RANGES.get(c, (30, 60))[0] for c in cats)
        raw_max = sum(CATEGORY_PRICE_RANGES.get(c, (30, 60))[1] for c in cats)
        per_min = round(raw_min * mult * discount)
        per_max = round(raw_max * mult * discount)

        return (
            f"Estimate for {guests} guests via {SERVICE_LABELS[service]}"
            f"{'(5% bulk discount applied)' if guests >= 50 else ''}:\n"
            f"- Per head: ₹{per_min}–₹{per_max}\n"
            f"- Total: ₹{per_min * guests:,}–₹{per_max * guests:,}\n"
            f"- Categories: {', '.join(cats)}\n"
            f"Get exact quote: https://cater-ease-delta.vercel.app/get-quote"
        )

    return "Unknown tool."


class ChatRequest(BaseModel):
    message:    str
    session_id: str = "default"


@router.post("")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    sid = req.session_id
    if sid not in _sessions:
        _sessions[sid] = []

    _sessions[sid].append({"role": "user", "content": req.message})
    history = _sessions[sid][-10:]

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        messages = list(history)
        reply = ""

        # Agentic loop — runs until Claude stops calling tools
        while True:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=512,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            for block in response.content:
                if hasattr(block, "text"):
                    reply = block.text

            if response.stop_reason != "tool_use":
                break

            # Execute every tool call Claude requested
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = _execute_tool(block.name, block.input, db)
                    print(f"[Chat] tool={block.name} inputs={block.input} → {result[:120]}")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

    except Exception as exc:
        print(f"[Chat] error: {exc}")
        reply = "Sorry, I'm having a moment! Please try again or call us directly."

    _sessions[sid].append({"role": "assistant", "content": reply})
    return {"reply": reply, "session_id": sid}


@router.post("/stream")
async def chat_stream(req: ChatRequest, db: Session = Depends(get_db)):
    sid = req.session_id
    if sid not in _sessions:
        _sessions[sid] = []

    _sessions[sid].append({"role": "user", "content": req.message})
    history = list(_sessions[sid][-10:])

    async def generate():
        import anthropic as sdk
        async_client = sdk.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        messages = list(history)
        full_reply = ""

        try:
            while True:
                # Stream each turn — tool turns yield no text, final turn streams the reply
                async with async_client.messages.stream(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=512,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=messages,
                ) as stream:
                    async for text in stream.text_stream:
                        full_reply += text
                        yield f"data: {json.dumps({'token': text})}\n\n"
                    final_msg = await stream.get_final_message()

                if final_msg.stop_reason != "tool_use":
                    break

                # Execute tools (sync, benefits from cache)
                tool_results = []
                assistant_content = []
                for block in final_msg.content:
                    if block.type == "text":
                        assistant_content.append({"type": "text", "text": block.text})
                    elif block.type == "tool_use":
                        assistant_content.append({
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                        if block.name == "add_to_cart":
                            result, cart_items = _execute_add_to_cart(block.input, db)
                            if cart_items:
                                yield f"data: {json.dumps({'cart_action': cart_items})}\n\n"
                        else:
                            result = _execute_tool(block.name, block.input, db)
                        print(f"[Chat/stream] tool={block.name} → {result[:80]}")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })

                messages.append({"role": "assistant", "content": assistant_content})
                messages.append({"role": "user", "content": tool_results})

        except Exception as exc:
            print(f"[Chat/stream] error: {exc}")
            err = "Sorry, I'm having a moment! Please try again or call us directly."
            full_reply = err
            yield f"data: {json.dumps({'token': err})}\n\n"

        _sessions[sid].append({"role": "assistant", "content": full_reply})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
