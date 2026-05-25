from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.menu import Dish, Category
from app.models.chat import ChatLead
import time
import json

router = APIRouter(prefix="/chat", tags=["chat"])

_sessions: dict[str, list] = {}

# TTL cache for menu tool results (5 min)
_tool_cache: dict[str, tuple[float, str]] = {}
_CACHE_TTL = 300

def _cache_get(key: str) -> str | None:
    if key in _tool_cache:
        ts, val = _tool_cache[key]
        if time.time() - ts < _CACHE_TTL:
            return val
    return None

def _cache_set(key: str, val: str) -> None:
    _tool_cache[key] = (time.time(), val)


# ── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are Priya, CaterEase's AI Sales Consultant — warm, professional, and focused on helping customers book the perfect catering experience.

Your mission: guide every visitor through the sales funnel and convert them into a booking.

=== YOUR SALES APPROACH ===
1. GREET & QUALIFY — Ask about their occasion, guest count, date, and city early in the conversation.
2. RECOMMEND — Use their answers to suggest the best service type and menu.
3. DEMONSTRATE VALUE — Show live menu, calculate a personalised quote.
4. CAPTURE LEAD — Before giving a detailed quote, ask for their name and phone number so you can follow up.
5. CLOSE — Add dishes to cart, push toward checkout.

=== CONVERSATION RULES ===
- Always introduce yourself as "Priya from CaterEase" on the first message.
- After 2-3 messages, naturally ask: "By the way, may I get your name and a contact number? I'd love to make sure we hold your preferred date."
- Use the customer's name once you have it.
- Always use tools to get live data — never make up dish names or prices.
- Be concise (2-4 sentences max), warm, and persuasive — not pushy.
- Always start your reply on a new line after any introductory sentence.
- Create gentle urgency for Oct–Feb bookings: "We fill up fast during wedding season."
- After adding items to cart, always encourage: "Ready to checkout? Your date is waiting!"

=== TOOLS AVAILABLE — USE THEM ===
- save_lead: Save customer contact info and event details to our CRM. Use as soon as you collect name/phone.
- get_lead_profile: Check if customer has shared details before — personalise based on this.
- recommend_package: Get a tailored service + menu recommendation based on event type and guest count.
- add_to_cart: Directly add dishes to the customer's cart when they ask.
- get_menu: Fetch live dish data from the database.
- get_categories: Get available menu categories.
- calculate_quote: Compute accurate price estimates.

=== SERVICE TYPES ===
- Meal Box (10+ guests): Individual boxes. Best for corporate.
- Delivery Box (10–120 guests): Bulk sealed boxes. Most popular & best value.
- Full Catering (50+ guests): Live counters + staff. Best for weddings.

=== PRICING ===
Delivery Box: base | Meal Box: base ×1.15 | Full Catering: base ×1.40
5% discount for 50+ guests automatically applied.

=== BOOKING LEAD TIMES ===
Small events: 7 days | Weddings: 15 days | Peak (Oct–Feb): 30 days

Website: https://cater-ease-delta.vercel.app
Free quote: https://cater-ease-delta.vercel.app/get-quote
""".strip()


# ── Package recommendations ──────────────────────────────────────────────────

PACKAGE_RECOMMENDATIONS = {
    "Wedding": {
        "service": "Full Catering",
        "reason": "Live counters and dedicated staff create a premium experience for wedding guests.",
        "must_have": ["Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts"],
        "optional": ["Beverages"],
        "tip": "We recommend 8–10 dishes minimum for a wedding spread.",
    },
    "Corporate": {
        "service": "Delivery Box",
        "reason": "Sealed individual boxes are hygienic, punctual, and professional.",
        "must_have": ["Main Course", "Breads"],
        "optional": ["Starters", "Beverages"],
        "tip": "A Main Course + Breads + Beverages combo works great for office lunches.",
    },
    "Birthday": {
        "service": "Delivery Box",
        "reason": "Best value per head with same-day delivery available.",
        "must_have": ["Starters", "Main Course", "Desserts"],
        "optional": ["Breads", "Beverages"],
        "tip": "Desserts are a must for birthdays — our Gulab Jamun and Kheer are crowd favourites!",
    },
    "Sangeet": {
        "service": "Full Catering",
        "reason": "Live counters add to the festive atmosphere of a Sangeet evening.",
        "must_have": ["Starters", "Main Course", "Beverages"],
        "optional": ["Desserts", "Breads"],
        "tip": "Heavy starters and mocktails work brilliantly for Sangeet events.",
    },
    "Farmhouse Party": {
        "service": "Delivery Box",
        "reason": "Bulk delivery boxes are easiest for outdoor venues.",
        "must_have": ["Starters", "Main Course"],
        "optional": ["Beverages", "Desserts"],
        "tip": "BBQ-style starters are very popular for farmhouse gatherings.",
    },
    "Tea Party": {
        "service": "Meal Box",
        "reason": "Individual meal boxes are perfect for small, elegant tea gatherings.",
        "must_have": ["Starters", "Beverages"],
        "optional": ["Desserts"],
        "tip": "Keep it light — 3-4 starter options with our beverage range works perfectly.",
    },
}

DEFAULT_PACKAGE = {
    "service": "Delivery Box",
    "reason": "Our most popular service with the best value per head.",
    "must_have": ["Main Course", "Breads"],
    "optional": ["Starters", "Desserts", "Beverages"],
    "tip": "Start with Main Course and Breads, then customise from there.",
}


# ── Tools definition ─────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "save_lead",
        "description": "Save or update the customer's contact information and event details in the CRM. Call this as soon as you collect name, phone, or any event details. Can be called multiple times — it updates the existing record.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name":        {"type": "string",  "description": "Customer's full name."},
                "phone":       {"type": "string",  "description": "Customer's phone number."},
                "email":       {"type": "string",  "description": "Customer's email address."},
                "event_type":  {"type": "string",  "description": "Type of event: Wedding, Birthday, Corporate, Sangeet, Farmhouse Party, Tea Party, Family Reunion, Other."},
                "event_date":  {"type": "string",  "description": "Event date in any format, e.g. '20 December 2025' or '2025-12-20'."},
                "guest_count": {"type": "integer", "description": "Number of guests expected."},
                "city":        {"type": "string",  "description": "City where the event will be held."},
                "budget":      {"type": "string",  "description": "Customer's approximate budget, e.g. '₹50,000' or '₹1-2 lakh'."},
                "notes":       {"type": "string",  "description": "Any other relevant details."},
                "stage":       {"type": "string",  "enum": ["new", "qualified", "quote", "booking"], "description": "Current sales stage."},
            },
            "required": [],
        },
    },
    {
        "name": "get_lead_profile",
        "description": "Retrieve the customer's saved profile for this session. Call this at the start of every conversation to personalise the interaction.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "recommend_package",
        "description": "Get a tailored service type and menu recommendation based on the customer's event. Use after you know the event type and guest count.",
        "input_schema": {
            "type": "object",
            "properties": {
                "event_type":  {"type": "string",  "description": "Type of event."},
                "guest_count": {"type": "integer", "description": "Number of guests."},
            },
            "required": ["event_type"],
        },
    },
    {
        "name": "add_to_cart",
        "description": "Add one or more dishes to the customer's cart. Use when the customer asks to add, order, or select specific dishes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dishes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name":     {"type": "string",  "description": "Dish name or partial name."},
                            "quantity": {"type": "integer", "description": "Quantity. Defaults to 1."},
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
        "description": "Fetch available dishes from the live menu with optional filters.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category":     {"type": "string", "description": "Category: Starters, Main Course, Breads, Rice & Biryani, Desserts, Beverages."},
                "dietary":      {"type": "string", "enum": ["veg", "non-veg", "jain", "vegan", "gluten-free"]},
                "popular_only": {"type": "boolean"},
            },
            "required": [],
        },
    },
    {
        "name": "get_categories",
        "description": "Get all menu categories.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "calculate_quote",
        "description": "Calculate estimated price range for an event.",
        "input_schema": {
            "type": "object",
            "properties": {
                "guests":      {"type": "integer", "description": "Number of guests."},
                "service_type":{"type": "string",  "enum": ["meal_box", "delivery_box", "full_catering"]},
                "categories":  {"type": "array", "items": {"type": "string"}, "description": "Dish categories to include."},
            },
            "required": ["guests", "service_type"],
        },
    },
]


# ── Price ranges & multipliers ────────────────────────────────────────────────

CATEGORY_PRICE_RANGES = {
    "Starters": (25, 55), "Main Course": (40, 80), "Breads": (15, 25),
    "Rice & Biryani": (35, 65), "Desserts": (25, 45), "Beverages": (25, 30),
}
SERVICE_MULTIPLIERS = {"meal_box": 1.15, "delivery_box": 1.0, "full_catering": 1.40}
SERVICE_LABELS      = {"meal_box": "Meal Box", "delivery_box": "Delivery Box", "full_catering": "Full Catering"}


# ── Tool helpers ─────────────────────────────────────────────────────────────

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
    items = inputs.get("dishes", [])
    found, not_found = [], []
    for item in items:
        name = item.get("name", "").strip()
        qty  = max(1, int(item.get("quantity", 1)))
        dish = db.query(Dish).filter(Dish.is_available == True, Dish.name.ilike(f"%{name}%")).first()
        if dish:
            found.append({"dish": _dish_to_dict(dish), "quantity": qty})
        else:
            not_found.append(name)
    parts = []
    if found:
        parts.append("Added: " + ", ".join(f"{f['dish']['name']} ×{f['quantity']} (₹{f['dish']['price_per_head']}/head)" for f in found))
    if not_found:
        parts.append(f"Not found: {', '.join(not_found)}")
    return ". ".join(parts) or "No dishes added.", found


def _execute_tool(name: str, inputs: dict, db: Session, session_id: str = "") -> str:
    # ── save_lead ──
    if name == "save_lead":
        lead = db.query(ChatLead).filter(ChatLead.session_id == session_id).first()
        if not lead:
            lead = ChatLead(session_id=session_id)
            db.add(lead)
        for field in ["name", "phone", "email", "event_type", "event_date", "city", "budget", "notes", "stage"]:
            if inputs.get(field):
                setattr(lead, field, inputs[field])
        if inputs.get("guest_count"):
            lead.guest_count = inputs["guest_count"]
        db.commit()
        saved = []
        if lead.name:  saved.append(f"name={lead.name}")
        if lead.phone: saved.append(f"phone={lead.phone}")
        if lead.event_type: saved.append(f"event={lead.event_type}")
        if lead.event_date: saved.append(f"date={lead.event_date}")
        if lead.guest_count: saved.append(f"guests={lead.guest_count}")
        return f"Lead saved. Profile: {', '.join(saved) if saved else 'empty'}."

    # ── get_lead_profile ──
    if name == "get_lead_profile":
        lead = db.query(ChatLead).filter(ChatLead.session_id == session_id).first()
        if not lead:
            return "No profile found for this session. This is a new visitor."
        parts = []
        if lead.name:        parts.append(f"Name: {lead.name}")
        if lead.phone:       parts.append(f"Phone: {lead.phone}")
        if lead.email:       parts.append(f"Email: {lead.email}")
        if lead.event_type:  parts.append(f"Event: {lead.event_type}")
        if lead.event_date:  parts.append(f"Date: {lead.event_date}")
        if lead.guest_count: parts.append(f"Guests: {lead.guest_count}")
        if lead.city:        parts.append(f"City: {lead.city}")
        if lead.budget:      parts.append(f"Budget: {lead.budget}")
        if lead.stage:       parts.append(f"Stage: {lead.stage}")
        return "Returning visitor. " + " | ".join(parts) if parts else "Returning visitor — no details saved yet."

    # ── recommend_package ──
    if name == "recommend_package":
        event = inputs.get("event_type", "").strip()
        guests = inputs.get("guest_count", 0)
        pkg = PACKAGE_RECOMMENDATIONS.get(event, DEFAULT_PACKAGE)
        lines = [
            f"Recommended service: {pkg['service']}",
            f"Why: {pkg['reason']}",
            f"Must-have courses: {', '.join(pkg['must_have'])}",
            f"Optional additions: {', '.join(pkg['optional'])}",
            f"Pro tip: {pkg['tip']}",
        ]
        if guests >= 50:
            lines.append("Good news: 5% bulk discount applies automatically!")
        return "\n".join(lines)

    # ── get_categories ──
    if name == "get_categories":
        cached = _cache_get("categories")
        if cached: return cached
        cats = db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()
        result = f"Available categories: {', '.join(c.name for c in cats)}"
        _cache_set("categories", result)
        return result

    # ── get_menu ──
    if name == "get_menu":
        cache_key = f"menu:{inputs.get('category','')}:{inputs.get('dietary','')}:{inputs.get('popular_only','')}"
        cached = _cache_get(cache_key)
        if cached: return cached
        q = db.query(Dish).filter(Dish.is_available == True)
        if inputs.get("category"):
            cat = db.query(Category).filter(Category.name.ilike(inputs["category"])).first()
            if cat: q = q.filter(Dish.category_id == cat.id)
        dietary = inputs.get("dietary", "")
        if dietary == "veg":           q = q.filter(Dish.is_veg == True)
        elif dietary == "non-veg":     q = q.filter(Dish.is_veg == False)
        elif dietary == "jain":        q = q.filter(Dish.is_jain == True)
        elif dietary == "vegan":       q = q.filter(Dish.is_vegan == True)
        elif dietary == "gluten-free": q = q.filter(Dish.is_gluten_free == True)
        if inputs.get("popular_only"): q = q.filter(Dish.is_popular == True)
        dishes = q.all()
        if not dishes: return "No dishes found."
        lines = []
        for d in dishes:
            tags = []
            if d.is_veg:  tags.append("Veg")
            if d.is_jain: tags.append("Jain")
            if d.is_vegan: tags.append("Vegan")
            if d.is_gluten_free: tags.append("GF")
            if d.is_popular: tags.append("⭐ Popular")
            lines.append(f"- {d.name}: ₹{d.price_per_head}/head [{', '.join(tags)}] — {d.description or ''}")
        result = "\n".join(lines)
        _cache_set(cache_key, result)
        return result

    # ── calculate_quote ──
    if name == "calculate_quote":
        guests = inputs["guests"]
        service = inputs["service_type"]
        cats = inputs.get("categories") or list(CATEGORY_PRICE_RANGES.keys())
        mult = SERVICE_MULTIPLIERS.get(service, 1.0)
        discount = 0.95 if guests >= 50 else 1.0
        raw_min = sum(CATEGORY_PRICE_RANGES.get(c, (30, 60))[0] for c in cats)
        raw_max = sum(CATEGORY_PRICE_RANGES.get(c, (30, 60))[1] for c in cats)
        per_min = round(raw_min * mult * discount)
        per_max = round(raw_max * mult * discount)
        return (
            f"Quote for {guests} guests via {SERVICE_LABELS[service]}"
            f"{'(5% bulk discount applied)' if guests >= 50 else ''}:\n"
            f"- Per head: ₹{per_min}–₹{per_max}\n"
            f"- Total: ₹{per_min * guests:,}–₹{per_max * guests:,}\n"
            f"- Courses: {', '.join(cats)}\n"
            f"Exact quote: https://cater-ease-delta.vercel.app/get-quote"
        )

    # ── add_to_cart (string result only — cart_action emitted by streaming endpoint) ──
    if name == "add_to_cart":
        msg, _ = _execute_add_to_cart(inputs, db)
        return msg

    return "Unknown tool."


# ── Request schema ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:    str
    session_id: str = "default"


# ── Non-streaming endpoint (fallback) ────────────────────────────────────────

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
        while True:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001", max_tokens=512,
                system=SYSTEM_PROMPT, tools=TOOLS, messages=messages,
            )
            for block in response.content:
                if hasattr(block, "text"): reply = block.text
            if response.stop_reason != "tool_use": break
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = _execute_tool(block.name, block.input, db, sid)
                    tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": result})
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
    except Exception as exc:
        print(f"[Chat] error: {exc}")
        reply = "Sorry, I'm having a moment! Please try again."
    _sessions[sid].append({"role": "assistant", "content": reply})
    return {"reply": reply, "session_id": sid}


# ── Streaming endpoint ────────────────────────────────────────────────────────

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
                async with async_client.messages.stream(
                    model="claude-haiku-4-5-20251001", max_tokens=512,
                    system=SYSTEM_PROMPT, tools=TOOLS, messages=messages,
                ) as stream:
                    async for text in stream.text_stream:
                        full_reply += text
                        yield f"data: {json.dumps({'token': text})}\n\n"
                    final_msg = await stream.get_final_message()

                if final_msg.stop_reason != "tool_use":
                    break

                tool_results = []
                assistant_content = []
                for block in final_msg.content:
                    if block.type == "text":
                        assistant_content.append({"type": "text", "text": block.text})
                    elif block.type == "tool_use":
                        assistant_content.append({
                            "type": "tool_use", "id": block.id,
                            "name": block.name, "input": block.input,
                        })
                        if block.name == "add_to_cart":
                            result, cart_items = _execute_add_to_cart(block.input, db)
                            if cart_items:
                                yield f"data: {json.dumps({'cart_action': cart_items})}\n\n"
                        else:
                            result = _execute_tool(block.name, block.input, db, sid)
                        print(f"[Chat/stream] tool={block.name} → {result[:80]}")
                        tool_results.append({
                            "type": "tool_result", "tool_use_id": block.id, "content": result,
                        })

                messages.append({"role": "assistant", "content": assistant_content})
                messages.append({"role": "user", "content": tool_results})

        except Exception as exc:
            print(f"[Chat/stream] error: {exc}")
            err = "Sorry, I'm having a moment! Please try again."
            full_reply = err
            yield f"data: {json.dumps({'token': err})}\n\n"

        _sessions[sid].append({"role": "assistant", "content": full_reply})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
