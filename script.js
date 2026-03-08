// Initialize Supabase Client
// NOTE: Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://mswnhmpumqhsetgjpmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd25obXB1bXFoc2V0Z2pwbW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDg1MDMsImV4cCI6MjA4ODQ4NDUwM30.gS9fAwFP7iSqy0hjWoPI9s96H2CPSGFnpKosu5WuiOI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // State
    let books = [];

    // DOM Elements
    const form = document.getElementById('add-book-form');
    const titleInput = document.getElementById('book-title');
    const categorySelect = document.getElementById('book-category');
    const statusSelect = document.getElementById('book-status');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Lists
    const toReadTechList = document.getElementById('to-read-tech-list');
    const toReadNonTechList = document.getElementById('to-read-non-tech-list');
    const alreadyReadTechList = document.getElementById('already-read-tech-list');
    const alreadyReadNonTechList = document.getElementById('already-read-non-tech-list');

    // Initialize App
    fetchAndRenderBooks();

    // Event Listeners
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        const status = statusSelect.value;

        if (title) {
            // Disable form while saving
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';

            await addBook(title, category, status);
            
            titleInput.value = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Book';
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Supabase Operations
    async function fetchAndRenderBooks() {
        const { data, error } = await supabaseClient
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching books:', error);
            // Ignore failure if not configured (so page still loads)
            return;
        }
        
        books = data || [];
        renderBooks();
    }

    async function addBook(title, category, status) {
        const { error } = await supabaseClient
            .from('books')
            .insert([{ title, category, status }]);
            
        if (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book. Check console and make sure your Supabase keys are configured.');
            return;
        }
        
        await fetchAndRenderBooks();
    }

    async function deleteBook(id) {
        const { error } = await supabaseClient
            .from('books')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error('Error deleting book:', error);
            alert('Failed to delete book.');
            return;
        }
        
        await fetchAndRenderBooks();
    }

    async function toggleStatus(id, currentStatus) {
        const newStatus = currentStatus === 'To Read' ? 'Already Read' : 'To Read';
        const { error } = await supabaseClient
            .from('books')
            .update({ status: newStatus })
            .eq('id', id);
            
        if (error) {
            console.error('Error updating status:', error);
            alert('Failed to update book status.');
            return;
        }
        
        await fetchAndRenderBooks();
    }

    // Render Function
    function renderBooks() {
        // Clear current lists
        toReadTechList.innerHTML = '';
        toReadNonTechList.innerHTML = '';
        alreadyReadTechList.innerHTML = '';
        alreadyReadNonTechList.innerHTML = '';

        books.forEach(book => {
            const li = document.createElement('li');
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'book-title';
            titleSpan.textContent = book.title;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';

            const moveBtn = document.createElement('button');
            moveBtn.className = 'btn-move';
            moveBtn.textContent = book.status === 'To Read' ? 'Mark as Read' : 'Move to To Read';
            moveBtn.onclick = () => toggleStatus(book.id, book.status);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteBook(book.id);

            actionsDiv.appendChild(moveBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(titleSpan);
            li.appendChild(actionsDiv);

            // Append to correct list
            if (book.status === 'To Read') {
                if (book.category === 'Tech') {
                    toReadTechList.appendChild(li);
                } else {
                    toReadNonTechList.appendChild(li);
                }
            } else {
                if (book.category === 'Tech') {
                    alreadyReadTechList.appendChild(li);
                } else {
                    alreadyReadNonTechList.appendChild(li);
                }
            }
        });
    }
});