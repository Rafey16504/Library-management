import "./BookStorage.css";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface Book {
  title: string;
  author: string;
  book_owner: string;
  borrow_date?: string;
  borrow_user?: string;
  borrow_status: string;
  id: string;
  book_file:string;
}

function BookStorage() {
  const [books, setBooks] = useState<Book[]>([]);
  const location = useLocation();
  const [message, setMessage] = useState("");
  const { loggedInAccount } = location.state || {};

  // const downloadFile = async (bookId: string, fileName: string) => {
  //   try {
  //     const response = await axios.get(`http://localhost:8100/library/book-file/${bookId}`, {
  //       responseType: 'blob',
  //     });

  //     const contentType = response.headers['Content-Type'];
  //     const extension = contentType === 'application/docx' ? 'docx' : 'pdf';
  
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', `${fileName}.${extension}`); // Use the correct file extension
  //     document.body.appendChild(link);
  //     link.click();
  
  //     // Clean up
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     setMessage("ERRRORRR")
  //     console.error('Error downloading file:', error);
  //   }
  // };

  async function fetchBooks() {
    try {
      const response = await axios.get("http://localhost:8100/library");
    
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (books.length == 0) {
      setMessage("No Books in the library!");
    } else {
      setMessage("");
    }
  }, [books]);

  return (
    <div className="Books">
      <header className="App-header">
        <div className="Header-text">
          <h1>Library Management</h1>
        </div>
      </header>
      <div className="profile">
        <button>{`User: ${loggedInAccount}`}</button>
      </div>
      <div>
        <div className="books-list">
          <div className="books-text">
            <h2>Books:</h2>
          </div>

          <ul>
            {books.map((book, index) => (
              <li key={book.id}>
                <span style={{ fontWeight: "bold" }}>Title:</span> {book.title}{" "}
                <br />
                <span>Author:</span> {book.author} <br />
                {book.borrow_status === "borrowed" && (
                  <>
                    <strong>Borrow Date:</strong> {book.borrow_date} <br />
                    <strong>Borrowed By:</strong> {book.borrow_user} <br />
                  </>
                )}
                <span>Borrow Status:</span> {book.borrow_status} <br />
                <span style={{ fontWeight: "bold" }}>ID:</span> {book.id} <br />
                <span style={{ fontWeight: "bold" }}>Uploaded By:</span>{" "}{book.book_owner} <br />
                
              </li>
            ))}
          </ul>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
}

export default BookStorage;
