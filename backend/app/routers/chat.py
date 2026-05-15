from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.menu import Dish, Category

router = APIRouter(prefix="/chat", tags=["chat"])

_sessions: dict[str, list] = {}

SYSTEM_PROMPT = """
You are CaterEase AI — a friendly, knowledgeable sales assistant for CaterEase, a premium catering service in Bangalore and Tirupati.

Your goal is to help customers choose the right service, understand pricing, and place an order. Be warm, concise, and proactive.

Always use your tools to get live data — never make up dish names, prices, or availability.

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


def _execute_tool(name: str, inputs: dict, db: Session) -> str:
    if name == "get_categories":
        cats = db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()
        return f"Available categories: {', '.join(c.name for c in cats)}"

    if name == "get_menu":
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

        return "\n".join(lines)

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
                max_tokens=1024,
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
