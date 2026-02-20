import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import axiosInstance from "../api/axiosInstance";

interface User {
  name: string;
  email: string;
  firebaseUid: string;
  createdAt: string;
}

interface Book {
  id?: string;
  title: string;
  author: string;
  description: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<Book>({ title: "", author: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the Form Modal

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axiosInstance.get("/api/user/me");
        setUser(userRes.data);
        const booksRes = await axiosInstance.get("/api/books");
        setBooks(booksRes.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const openModal = (book?: Book) => {
    if (book) {
      setForm(book);
      setEditingId(book.id!);
    } else {
      setForm({ title: "", author: "", description: "" });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ title: "", author: "", description: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axiosInstance.put(`/api/books/${editingId}`, form);
        setBooks(books.map((b) => (b.id === editingId ? res.data : b)));
      } else {
        const res = await axiosInstance.post("/api/books", form);
        setBooks([...books, res.data]);
      }
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axiosInstance.delete(`/api/books/${id}`);
      setBooks(books.filter((b) => b.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- TOP NAV --- */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-700">{user?.email.slice(0, 12).toUpperCase()}</span>
          </div>
          <button onClick={() => signOut(auth).then(() => navigate("/login"))} className="text-sm text-gray-500 hover:text-red-600 font-medium">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
            <p className="text-gray-500 mt-1">Manage your book collection in one place.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all flex items-center"
          >
            <span className="mr-2 text-xl leading-none">+</span> Add New Book
          </button>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{book.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{book.author}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => openModal(book)} className="text-blue-600 hover:text-blue-800 font-bold text-xs">EDIT</button>
                    <button onClick={() => handleDelete(book.id!)} className="text-red-600 hover:text-red-800 font-bold text-xs">DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {books.length === 0 && <div className="p-20 text-center text-gray-400">Your library is empty.</div>}
        </div>
      </main>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Book Details" : "Add New Book"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Book Title</label>
                <input 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                  placeholder="e.g. The Great Gatsby" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Author</label>
                <input 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                  placeholder="e.g. F. Scott Fitzgerald" 
                  value={form.author} 
                  onChange={e => setForm({ ...form, author: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all min-h-[120px]" 
                  placeholder="What's this book about?" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors">
                  {editingId ? "Update Book" : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}