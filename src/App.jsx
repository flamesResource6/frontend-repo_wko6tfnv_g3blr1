import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {product.image_url ? (
        <img src={product.image_url} alt={product.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-purple-100 to-blue-100" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-bold text-gray-900">{product.price} <span className="text-xs">SYP</span></span>
          <button onClick={() => onAdd(product)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            ازايده + Add
          </button>
        </div>
      </div>
    </div>
  )
}

function Cart({ items, onChangeQty, onCheckout }) {
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  return (
    <div className="sticky top-4 bg-white rounded-xl shadow-lg border p-4">
      <h3 className="font-bold text-lg">السلة • Cart</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 && <div className="text-gray-500 text-sm">فاضية حالياً</div>}
        {items.map((i) => (
          <div key={i.product_id} className="flex items-center justify-between text-sm">
            <div className="flex-1 pr-2">
              <div className="font-medium line-clamp-1">{i.title}</div>
              <div className="text-gray-500">{i.price} SYP</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onChangeQty(i.product_id, Math.max(1, i.quantity - 1))} className="px-2 py-1 rounded bg-gray-100">-</button>
              <span>{i.quantity}</span>
              <button onClick={() => onChangeQty(i.product_id, i.quantity + 1)} className="px-2 py-1 rounded bg-gray-100">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-semibold">المجموع • Total</span>
        <span className="font-bold">{total} SYP</span>
      </div>
      <button
        disabled={items.length === 0}
        onClick={onCheckout}
        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 disabled:opacity-50"
      >
        توصيل والدفع عند الاستلام • COD
      </button>
    </div>
  )
}

function CheckoutModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', notes: '' })
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold">معلومات التوصيل • Delivery Info</h3>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {['name','phone','city','address'].map((k) => (
            <input key={k} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} placeholder={
              k==='name' ? 'الاسم Name' : k==='phone' ? 'الموبايل Phone' : k==='city' ? 'المدينة City' : 'العنوان Address'
            } className="border rounded-lg px-3 py-2" />
          ))}
          <textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="ملاحظات Notes" className="border rounded-lg px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">إلغاء Cancel</button>
          <button onClick={()=>onSubmit(form)} className="px-3 py-2 rounded-lg bg-blue-600 text-white">تأكيد الطلب • Confirm</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [message, setMessage] = useState('')

  const fetchProducts = async () => {
    const url = new URL(`${API_BASE}/api/products`)
    if (query) url.searchParams.set('q', query)
    const res = await fetch(url)
    const data = await res.json()
    setProducts(data)
  }

  useEffect(() => { fetchProducts() }, [])

  const addToCart = (p) => {
    setCart((prev) => {
      const existing = prev.find(i => i.product_id === p.id)
      if (existing) {
        return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product_id: p.id, title: p.title, price: p.price, quantity: 1 }]
    })
  }

  const changeQty = (id, qty) => {
    setCart(prev => prev.map(i => i.product_id === id ? { ...i, quantity: qty } : i))
  }

  const checkout = async (info) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customer: info,
          payment_method: 'COD'
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('تم تأكيد طلبك! Your order is placed.')
        setCart([])
        setShowCheckout(false)
      } else {
        setMessage(data.detail || 'صار في مشكلة!')
      }
    } catch (e) {
      setMessage('Network error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-extrabold text-xl">Souq Levant شوب</div>
          <div className="ml-auto flex items-center gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="دور Search" className="border rounded-lg px-3 py-2 w-64" />
            <button onClick={fetchProducts} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Go</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
        <div className="md:col-span-1">
          <Cart items={cart} onChangeQty={changeQty} onCheckout={()=>setShowCheckout(true)} />
          {message && <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">{message}</div>}
        </div>
      </main>

      <CheckoutModal open={showCheckout} onClose={()=>setShowCheckout(false)} onSubmit={checkout} />

      <footer className="py-6 text-center text-sm text-gray-500">الدفع عند الاستلام • Payment on delivery (COD)</footer>
    </div>
  )
}

export default App
