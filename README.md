# Mobile POS System for Bun & Chai Shop

A 100% mobile-friendly Point of Sale (POS) application built with Vue 3, Tailwind CSS, and Supabase.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile devices with thumb-friendly buttons
- **Item Management**: Add, edit, enable/disable items with stock tracking
- **Order Taking**: Quick order entry with +/- buttons and live total calculation
- **Draft Orders**: Save and reuse common orders for quick checkout
- **Order History**: View and manage past orders
- **Reports & Analytics**: Track sales, revenue, and most sold items
- **Stock Management**: Optional stock quantity tracking with automatic updates

## 📋 Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm or yarn
- Supabase account (free tier works)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

1. Go to your Supabase project SQL Editor
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script to create all tables, indexes, and RLS policies

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📱 Usage

### Order Screen (Main POS)
- Tap ➕ to add items to cart
- Tap ➖ to remove items
- View live total at the bottom
- Place order or save as draft

### Items Management
- Add new items with name, price, and optional stock
- Enable/disable items (disabled items won't show in POS)
- Edit item details

### Draft Orders
- Save common orders for quick reuse
- Load drafts with one tap
- Edit after loading

### Order History
- View all past orders
- Load order to edit/duplicate
- Delete orders if needed

### Reports
- View sales by period (today/week/month)
- See item-wise sales and revenue
- Identify most sold items

## 🗄️ Database Schema

The application uses 4 main tables:

- **items**: Product catalog
- **orders**: Order records
- **order_items**: Order line items (junction table)
- **draft_orders**: Saved draft orders

See `database/schema.sql` for complete schema details.

## 🎨 Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Tailwind CSS v4** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling
- **Vue Router** - Official router for Vue.js
- **Supabase** - Backend as a Service (BaaS)

## 📦 Project Structure

```
src/
├── components/          # Vue components
│   ├── OrderScreen.vue      # Main POS interface
│   ├── ItemCard.vue         # Item display card
│   ├── OrderSummary.vue     # Cart summary bar
│   ├── ItemsManagement.vue  # Item CRUD
│   ├── OrderHistory.vue     # Order list
│   ├── Reports.vue          # Analytics
│   └── BottomNav.vue        # Navigation bar
├── composables/        # Vue composables
│   ├── useItems.js          # Item management logic
│   ├── useCart.js           # Shopping cart logic
│   ├── useOrders.js         # Order management
│   └── useDraftOrders.js    # Draft order logic
├── config/             # Configuration
│   └── supabase.js          # Supabase client
├── router/             # Routing
│   └── index.js            # Route definitions
└── assets/             # Static assets
    ├── main.css            # Main styles
    └── base.css            # Base styles
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Currently allows all operations (adjust policies based on your auth needs)
- Environment variables for sensitive credentials

## 🚧 Future Enhancements

- [ ] Authentication (shop owner login)
- [ ] Offline support with localStorage sync
- [ ] Sound/vibration feedback on order placement
- [ ] Dark mode
- [ ] PWA install support
- [ ] CSV export for reports
- [ ] Print receipt functionality

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
