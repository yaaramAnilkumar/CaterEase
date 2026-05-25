"""
CaterEase RAG Knowledge Base
Each document is a self-contained chunk that answers one or more related questions.
"""

DOCUMENTS = [
    # ── Service Areas ──────────────────────────────────────────────────────────
    {
        "id": "service_areas",
        "content": (
            "CaterEase operates in Bangalore and Tirupati. "
            "In Bangalore we cover all major areas: Whitefield, Indiranagar, Koramangala, "
            "HSR Layout, Jayanagar, JP Nagar, Marathahalli, Electronic City, Hebbal, "
            "Yelahanka, Bannerghatta Road, BTM Layout, Sarjapur Road, and surrounding localities. "
            "In Tirupati we serve the main city and surrounding areas including Renigunta, "
            "Chandragiri, and Srikalahasti. "
            "We do not currently operate in other cities, but are expanding soon."
        ),
        "metadata": {"category": "service_area"},
    },
    {
        "id": "delivery_radius",
        "content": (
            "CaterEase delivers within a 30 km radius from our central kitchens in Bangalore and Tirupati. "
            "For venues outside this radius, please contact us for a custom quote — additional travel charges may apply. "
            "Full Catering (live counter) service is available within a 25 km radius. "
            "Delivery Box and Meal Box orders can reach up to 30 km with our insulated transport."
        ),
        "metadata": {"category": "service_area"},
    },

    # ── Service Types ──────────────────────────────────────────────────────────
    {
        "id": "service_types_overview",
        "content": (
            "CaterEase offers three service types: "
            "1. Full Catering (50+ guests): Live cooking counters with dedicated staff at your venue. "
            "Includes setup, live stations, serving staff, and cleanup. Best for weddings and large functions. "
            "2. Delivery Box (10–120 guests): Bulk sealed food containers delivered to your venue. "
            "Food is packed in large serving trays — you serve from these. Our most popular and best-value option. "
            "3. Meal Box (10+ guests): Individual pre-packed meals per person, ideal for corporate lunches "
            "and events where hygiene and individual portions are important."
        ),
        "metadata": {"category": "services"},
    },
    {
        "id": "full_catering_details",
        "content": (
            "Full Catering service includes: professional chef team, live cooking stations, serving staff, "
            "chafing dishes and warmers, serving spoons and ladles, disposable plates and cutlery (or steel "
            "on request), setup 2 hours before event, and cleanup after. "
            "Minimum 50 guests required. "
            "Staff count: 1 chef per 75 guests, 1 serving staff per 30 guests. "
            "We bring our own gas cylinders and cooking equipment. "
            "Full Catering costs 40% more per head than the Delivery Box base price."
        ),
        "metadata": {"category": "services"},
    },
    {
        "id": "delivery_box_details",
        "content": (
            "Delivery Box service: food is cooked in our central kitchen and delivered in sealed, "
            "insulated bulk containers (approx. 10-litre trays). "
            "Each tray serves approximately 15–20 people. "
            "Delivery includes: food containers, serving spoons, and disposable plates/cutlery on request. "
            "We arrive 30–45 minutes before your event start time. "
            "Minimum order: 10 guests. Maximum per single order: 120 guests. "
            "This is our most popular option — same food quality as Full Catering at the base price."
        ),
        "metadata": {"category": "services"},
    },

    # ── Dietary Options ────────────────────────────────────────────────────────
    {
        "id": "dietary_jain",
        "content": (
            "Yes, CaterEase offers Jain food options. "
            "Jain dishes exclude all root vegetables: onion, garlic, potato, carrot, beetroot, and tubers. "
            "Jain items are prepared separately in our kitchen to avoid cross-contamination. "
            "We have a dedicated Jain menu with starters, main course, breads, and desserts. "
            "To request a Jain menu, mention it while booking or tell our consultant. "
            "Mixed events (some guests Jain, some not) are also handled — we serve Jain dishes first."
        ),
        "metadata": {"category": "dietary"},
    },
    {
        "id": "dietary_veg_nonveg",
        "content": (
            "CaterEase handles both pure vegetarian and mixed (veg + non-veg) events. "
            "For pure veg events, our entire team follows strict veg-only preparation — "
            "no non-veg items enter the kitchen or serving area. "
            "For mixed events, veg and non-veg dishes are prepared separately and served at different counters. "
            "Our kitchen has separate prep areas and utensils for veg and non-veg cooking."
        ),
        "metadata": {"category": "dietary"},
    },
    {
        "id": "dietary_vegan_gf",
        "content": (
            "CaterEase offers vegan and gluten-free options. "
            "Vegan dishes contain no animal products (no dairy, no eggs, no honey). "
            "We have a growing vegan menu — please ask our consultant for the current vegan items. "
            "Gluten-free options are available for guests with wheat allergies or celiac preferences. "
            "Please inform us of dietary requirements at least 48 hours before the event so we can prepare accordingly. "
            "We cannot guarantee 100% allergen-free environments as our kitchen handles multiple ingredients."
        ),
        "metadata": {"category": "dietary"},
    },

    # ── Pricing & Payment ──────────────────────────────────────────────────────
    {
        "id": "pricing_overview",
        "content": (
            "CaterEase pricing is per head (per person). "
            "Prices depend on which courses you choose: "
            "Starters: ₹25–₹55/head, Main Course: ₹40–₹80/head, Breads: ₹15–₹25/head, "
            "Rice & Biryani: ₹35–₹65/head, Desserts: ₹25–₹45/head, Beverages: ₹25–₹30/head. "
            "Service multipliers: Delivery Box = base price, Meal Box = base ×1.15, "
            "Full Catering = base ×1.40. "
            "Bulk discount: 5% off automatically for orders of 50+ guests. "
            "Final pricing depends on exact dish selection — use our online quote tool for accuracy."
        ),
        "metadata": {"category": "pricing"},
    },
    {
        "id": "payment_methods",
        "content": (
            "CaterEase accepts the following payment methods: "
            "UPI (Google Pay, PhonePe, Paytm, BHIM), "
            "Credit and debit cards (Visa, Mastercard, RuPay), "
            "Net banking, "
            "Cash (for orders under ₹25,000), "
            "Bank transfer/NEFT for large corporate orders. "
            "Payment structure: 30% advance required to confirm booking, "
            "remaining 70% due on the day of the event before service begins. "
            "GST receipts and invoices are provided for all orders. "
            "Corporate clients can request monthly invoicing after establishing an account."
        ),
        "metadata": {"category": "payment"},
    },
    {
        "id": "gst_corporate",
        "content": (
            "CaterEase is GST registered. GST at 5% applies to all catering services. "
            "Detailed tax invoices are provided for every order. "
            "Corporate clients can register for a business account to receive: "
            "monthly consolidated invoices, GST-compliant billing with GSTIN, "
            "dedicated account manager, priority booking, and volume discounts for regular orders. "
            "To set up a corporate account, contact us at business@caterease.in or call our sales team."
        ),
        "metadata": {"category": "payment"},
    },

    # ── Cancellation & Refunds ─────────────────────────────────────────────────
    {
        "id": "cancellation_policy",
        "content": (
            "CaterEase cancellation policy: "
            "Cancellation 15+ days before event: 90% refund (10% processing fee retained). "
            "Cancellation 7–14 days before event: 50% refund. "
            "Cancellation 3–6 days before event: 25% refund. "
            "Cancellation less than 72 hours before event: No refund (full advance forfeited). "
            "Rescheduling (date change) is allowed free of charge up to 7 days before event, "
            "subject to availability. After that, a ₹500 rescheduling fee applies. "
            "Refunds are processed within 5–7 business days to the original payment method."
        ),
        "metadata": {"category": "cancellation"},
    },
    {
        "id": "modification_policy",
        "content": (
            "You can modify your order (add dishes, change guest count, update menu) up to 48 hours "
            "before your event. Changes within 48 hours may not be accommodated. "
            "Increasing guest count by more than 20% within 72 hours may not be possible due to "
            "ingredient procurement. "
            "Reducing guest count is possible up to 48 hours before the event — "
            "you will be charged for the reduced count if notified in time."
        ),
        "metadata": {"category": "cancellation"},
    },

    # ── Booking Process ────────────────────────────────────────────────────────
    {
        "id": "booking_process",
        "content": (
            "How to book CaterEase: "
            "1. Get a quote online at cater-ease-delta.vercel.app/get-quote or chat with Priya. "
            "2. Confirm your menu and guest count with our consultant. "
            "3. Pay 30% advance to lock in your date. "
            "4. Receive booking confirmation via SMS and email. "
            "5. We call you 24 hours before the event to confirm logistics. "
            "6. Our team arrives on event day for setup. "
            "Booking can be done online, by phone, or through WhatsApp. "
            "We recommend booking at least 7 days in advance for small events and "
            "15 days for weddings."
        ),
        "metadata": {"category": "booking"},
    },
    {
        "id": "advance_booking",
        "content": (
            "Advance booking requirements at CaterEase: "
            "Small events (under 50 guests): minimum 7 days notice. "
            "Medium events (50–150 guests): minimum 10 days notice. "
            "Large weddings (150+ guests): minimum 15 days notice. "
            "Peak season (October to February) — wedding season in South India — "
            "we recommend booking 30 days in advance as dates fill up quickly. "
            "Last-minute orders (under 48 hours) may be possible for Delivery Box orders under 50 guests "
            "subject to availability — please call us directly."
        ),
        "metadata": {"category": "booking"},
    },
    {
        "id": "tasting_session",
        "content": (
            "CaterEase offers complimentary tasting sessions for orders above ₹50,000 or 100+ guests. "
            "Tasting sessions are held at our central kitchen in Bangalore on weekday mornings "
            "(10 AM – 12 PM). "
            "You can sample up to 6 dishes. Please book your tasting at least 3 days in advance. "
            "For smaller orders, we offer tasting boxes delivered to your home for ₹499 "
            "(redeemable against your booking). "
            "Contact us to schedule a tasting."
        ),
        "metadata": {"category": "booking"},
    },

    # ── Hygiene & Quality ──────────────────────────────────────────────────────
    {
        "id": "hygiene_certification",
        "content": (
            "CaterEase is FSSAI certified (Food Safety and Standards Authority of India). "
            "Our kitchens follow HACCP (Hazard Analysis Critical Control Points) protocols. "
            "All our chefs hold valid Food Handler certificates. "
            "We use fresh ingredients sourced daily — no frozen pre-cooked food. "
            "Our vehicles are insulated and temperature-monitored for safe delivery. "
            "We have never received a major food safety violation in our operating history. "
            "Hygiene audit reports are available on request for corporate clients."
        ),
        "metadata": {"category": "hygiene"},
    },
    {
        "id": "food_freshness",
        "content": (
            "All CaterEase food is freshly prepared on the day of your event. "
            "We do not use pre-cooked frozen items. Ingredients are procured fresh each morning. "
            "For Full Catering, food is cooked live at your venue. "
            "For Delivery Box, food is cooked in our kitchen and dispatched within 2 hours before your event. "
            "We guarantee food safety for 2 hours after delivery in normal conditions. "
            "For longer events, we recommend Full Catering with live counters to ensure food freshness."
        ),
        "metadata": {"category": "hygiene"},
    },

    # ── Event Day Logistics ────────────────────────────────────────────────────
    {
        "id": "setup_timing",
        "content": (
            "CaterEase event day logistics: "
            "Full Catering: Our team arrives 2 hours before the event to set up live counters. "
            "Delivery Box: Delivery arrives 30–45 minutes before your event start time. "
            "Meal Box: Delivery arrives 15–30 minutes before. "
            "We will call you the evening before to confirm the exact arrival time. "
            "Please ensure venue access is available for our team on arrival. "
            "For Full Catering, we need a water source and electricity connection (for warmers)."
        ),
        "metadata": {"category": "logistics"},
    },
    {
        "id": "equipment_included",
        "content": (
            "What CaterEase provides with each service: "
            "Full Catering: Chafing dishes, warmers, live counter tables, serving utensils, "
            "disposable plates, glasses, and cutlery. Decorative counter setup on request. "
            "Delivery Box: Insulated serving trays with lids, serving spoons. "
            "Plates and cutlery available on request (₹10/person). "
            "Meal Box: Individual meal containers with cutlery included. "
            "We do not provide tables, chairs, tablecloths, or venue decoration — "
            "please arrange these separately. Flower decoration for food counters can be arranged on request."
        ),
        "metadata": {"category": "logistics"},
    },
    {
        "id": "leftovers_policy",
        "content": (
            "Leftover food policy: For Delivery Box and Full Catering, any unused food belongs to you. "
            "We can pack leftovers in containers (bring your own containers, or we provide at ₹5 each). "
            "For hygiene reasons, we do not take back or redistribute leftover food. "
            "We recommend ordering approximately 10% extra for buffer, especially for weddings. "
            "For meal boxes, any unopened boxes can be redistributed or kept — "
            "opened meal boxes should be consumed within 2 hours."
        ),
        "metadata": {"category": "logistics"},
    },

    # ── Special Requests ───────────────────────────────────────────────────────
    {
        "id": "custom_menu",
        "content": (
            "CaterEase can accommodate custom menu requests. "
            "If you have a specific dish in mind that's not on our standard menu, "
            "let us know at least 5 days before your event and we will check feasibility. "
            "Regional specialities (Andhra style, Karnataka Sadhya, North Indian Thali, etc.) "
            "can be arranged with advance notice. "
            "Special diets (low-sodium, diabetic-friendly, protein-rich) can be accommodated "
            "with 5 days notice. "
            "We do not offer international cuisine (Chinese, Italian, Continental) at this time."
        ),
        "metadata": {"category": "special_requests"},
    },
    {
        "id": "special_additions",
        "content": (
            "Special additions available from CaterEase: "
            "Welcome drinks / mocktail stations (₹30–₹50/head). "
            "Pan counter / mukhwas station for post-meal (₹20/head). "
            "Ice cream station for desserts (₹40–₹60/head). "
            "Fruit salad station (₹25/head). "
            "Live chaat counter (₹35–₹55/head). "
            "We do not provide alcohol — please arrange your own bar service. "
            "Birthday or wedding cakes are not included but we can coordinate with partner bakeries on request."
        ),
        "metadata": {"category": "special_requests"},
    },
    {
        "id": "outdoor_events",
        "content": (
            "CaterEase caters for outdoor events including farmhouse parties, garden weddings, "
            "terrace events, and open-air corporate gatherings. "
            "For outdoor events, please ensure: a covered area for food setup (tent or canopy), "
            "a water source for our cooking team, basic electricity for warmers (for Full Catering). "
            "We bring all our own cooking equipment and fuel. "
            "Extra surcharge of ₹15–₹25/head may apply for venues that are difficult to access "
            "or more than 20 km from our kitchen."
        ),
        "metadata": {"category": "special_requests"},
    },

    # ── Contact & Support ──────────────────────────────────────────────────────
    {
        "id": "contact_info",
        "content": (
            "CaterEase contact information: "
            "Website: https://cater-ease-delta.vercel.app "
            "Get a quote: https://cater-ease-delta.vercel.app/get-quote "
            "Phone/WhatsApp: +91-9999999999 (available 8 AM – 10 PM, 7 days a week). "
            "Email: hello@caterease.in "
            "Business/corporate inquiries: business@caterease.in "
            "Operating hours: Monday to Sunday, 8 AM to 10 PM. "
            "We aim to respond to all inquiries within 2 hours during business hours."
        ),
        "metadata": {"category": "contact"},
    },
    {
        "id": "about_caterease",
        "content": (
            "CaterEase is a premium catering company serving Bangalore and Tirupati. "
            "We specialise in weddings, corporate events, birthday parties, Sangeet, "
            "family reunions, and all social gatherings. "
            "Founded with the mission to make high-quality catering accessible and stress-free, "
            "we have served over 5,000 events and 10 lakh+ guests. "
            "Our team of experienced chefs uses fresh, locally sourced ingredients. "
            "We offer South Indian, North Indian, and Jain cuisines. "
            "CaterEase is FSSAI certified and ranked among the top catering services in Bangalore."
        ),
        "metadata": {"category": "about"},
    },
    {
        "id": "why_caterease",
        "content": (
            "Why choose CaterEase: "
            "1. Fresh food — cooked on the day of your event, never frozen. "
            "2. Transparent pricing — per head pricing with no hidden charges. "
            "3. Flexible service — three service types to suit every event size and budget. "
            "4. Dietary expertise — Jain, Veg, Non-veg, Vegan, Gluten-free all handled. "
            "5. Reliable — 98% on-time delivery track record. "
            "6. FSSAI certified kitchen with strict hygiene standards. "
            "7. Dedicated account manager for events above 100 guests. "
            "8. 5% discount for 50+ guest orders. "
            "We pride ourselves on making every event a culinary success."
        ),
        "metadata": {"category": "about"},
    },
]
