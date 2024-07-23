import "./App.css";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface Book {
  title: string;
  author: string;
  user: string;
  borrow_date?: string;
  borrow_user?: string;
  borrow_status: string;
  id: string;
}

function Library() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [fetchMessage, setFetchMessage] = useState("");
  const [borrowMessage, setBorrowMessage] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [book, setBook] = useState<Book | null>(null);
  const [bookBorrow, setBookBorrow] = useState<Book | null>(null);
  const [bookReturn, setBookReturn] = useState<Book | null>(null);
  const [retBook, setRetBook] = useState<Book | null>(null);
  const [deletedBook, setDeletedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [showBooks, setShowBooks] = useState(false);
  const [id, setID] = useState(String);
  const [borrowID, setBorrowID] = useState(String);
  const [returnID, setReturnID] = useState(String);
  const [deleteID, setDeleteID] = useState(String);

  const location = useLocation();
  const { loggedInAccount } = location.state || {};

  const navigate = useNavigate();

  const AllBooks = () => {
    return books;
  };

  const handleAddBook = async () => {
    if (title && author) {
      try {
        const { data } = await axios.post(
          `http://localhost:8000/library/${loggedInAccount}`,
          {
            title: title,
            author: author,
          }
        );
        console.log(data);
        setAddMessage(`Book "${title}" by ${author} successfully added!`);
        setTitle("");
        setAuthor("");
        fetchBooks();
        setTimeout(() => {
          setAddMessage("");
        }, 1000);
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          setAddMessage("Book already exists");
          console.log(error);
          setTimeout(() => {
            setAddMessage("");
          }, 4000);
        }
      }
    } else {
      setAddMessage("Both title and author are required.");
      setTimeout(() => {
        setAddMessage("");
      }, 4000);
    }
  };
  
  const fetchBookById = async () => {
    setBook(null);
    let found = false;

    for (let i = 0; i < books.length; i++) {
      if (books[i].id === id) {
        setBook(books[i]);
        found = true!;
        break;
      }
    }

    if (!found) {
      console.log("Error fetching book data:");
      setFetchMessage("No Book with this ID exists");
      setTimeout(() => {
        setFetchMessage("");
      }, 4000);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data } = await axios.get("http://localhost:8000/library");
      setBooks(data);
    } 
    catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const borrowBook = async () => {
    setBookBorrow(null);
    try {
      if (bookBorrow?.borrow_status === "borrowed") {
        setBookBorrow(null);
        setBorrowMessage("Book already Borrowed!");
        setTimeout(() => {
          setBorrowMessage("");
        }, 4000);
      }
      const { data } = await axios.post(
        `http://localhost:8000/library/borrow/${borrowID}`,
        {
          user: loggedInAccount,
        }
      );
      console.log(data);
      if (data.message) {
        setBookBorrow(null);
        setBorrowMessage("Book already Borrowed!");
        setTimeout(() => {
          setBorrowMessage("");
        }, 4000);
      } else {
        setBookBorrow(data);
        fetchBooks();
        setBorrowMessage("Book borrowed successfully!");
        setTimeout(() => {
          setBorrowMessage("");
        }, 4000);
      }
    } catch (error) {
      console.log("Error while borrowing!", error);
      setBorrowMessage(
        "Could not borrow book. Book with this ID does not exist."
      );
      setTimeout(() => {
        setBorrowMessage("");
      }, 4000);
    }
  };

  const returnBook = async () => {
    try {
        let retBook = null;
        for(let i = 0; i < books.length; i++) {
            if(books[i].id === returnID) {
                retBook = books[i];
                break; // Stop the loop once the book is found
            }
        }
        if (!retBook) {
            setReturnMessage("No book with such ID exists!");
        } else if (retBook.borrow_status === "not borrowed") {
            setReturnMessage("Book hasn't been borrowed yet!");
        } else if (retBook.borrow_status === "borrowed") {
            const {data} = await axios.post(`http://localhost:8000/library/return/${loggedInAccount}/${returnID}`);
            if(data.error)
            {
              setReturnMessage("Book can only be returned if you borrowed it!")
            }
             else{
              await fetchBooks();
              setBookReturn(data);
              setReturnMessage("Book returned successfully!");
             } 
            
        }
        setTimeout(() => {
            setReturnMessage("");
        }, 4000);
    } catch(error) {
        console.log("error while returning", error);
        setReturnMessage("Error while returning the book!");
        setTimeout(() => {
            setReturnMessage("");
        }, 4000);
    }
};
  const deleteBook = async () => {
    try {
        const { data } = await axios.delete(
          `http://localhost:8000/library/${loggedInAccount}/${deleteID}`
        );
        if(data.error)
        {
          console.log("Error occured", data.error);
          setDeleteMessage("Failed to delete book. Only the owner can delete it!")
          setTimeout(() => {
            setDeleteMessage("");
          }, 4000);
        }else{
          console.log("Deleted Successfully");
          setDeleteMessage("Book removed!");
          fetchBooks();
          setTimeout(() => {
            setDeleteMessage("");
          }, 4000);
        }
          
        }
      
    catch (error:any) {
        console.log("Error occured", error);
        setDeleteMessage("Could not delete. Book with this ID does not exist");
        setTimeout(() => {
          setDeleteMessage("");
        }, 4000);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (bookBorrow) {
      const timer = setTimeout(() => {
        setBookBorrow(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [bookBorrow]);

  useEffect(() => {
    if (bookReturn) {
      const timer = setTimeout(() => {
        setBookReturn(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [bookReturn]);


  useEffect(() => {
    if (book) {
      const timer = setTimeout(() => {
        setBook(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [book]);

  const toggleShowBooks = () => {
    setShowBooks(!showBooks);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="Header-text">
          <h1>Library Management</h1>
        </div>
      </header>
      <div className="profile">
        <button>{`User: ${loggedInAccount}`}</button>
      </div>
      <div className="book-add">
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Author Name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        {addMessage && <div className="message">{addMessage}</div>}
        <div>
          <button onClick={handleAddBook}>Add Book</button>
        </div>
      </div>
      <div>
        <button
          onClick={() => {
            navigate("/library/AllBooks", {
              state: { loggedInAccount: loggedInAccount },
            });
          }}
        >
          {"Show Books"}
        </button>
      </div>

      <div className="input-group">
        <input
          type="text"
          value={id}
          onChange={(e) => setID(e.target.value)}
          placeholder="Enter Book ID"
        />
        <button onClick={fetchBookById}>Fetch Book</button>
        {fetchMessage && <div className="message">{fetchMessage}</div>}
      </div>

      {book && (
        <div className="result">
          <br />
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
          </li>
        </div>
      )}

      <div className="input-group">
        <input
          type="text"
          value={borrowID}
          onChange={(e) => setBorrowID(e.target.value)}
          placeholder="Enter Book ID"
        />
        <button onClick={borrowBook}>Borrow Book</button>
        {borrowMessage && <div className="message">{borrowMessage}</div>}
      </div>

      {bookBorrow && (
        <div className="result">
          <br />
          <span style={{ fontWeight: "bold" }}>Title:</span> {bookBorrow.title}{" "}
          <br />
          <span>Author:</span> {bookBorrow.author} <br />
          {bookBorrow.borrow_status === "borrowed" && (
            <>
              <strong>Borrow Date:</strong> {bookBorrow.borrow_date} <br />
            </>
          )}
        </div>
      )}

      <div className="input-group">
        <input
          type="text"
          value={returnID}
          onChange={(e) => setReturnID(e.target.value)}
          placeholder="Enter Book ID"
        />
        <button onClick={returnBook}>Return Book</button>
        {returnMessage && <div className="message">{returnMessage}</div>}
      </div>

      {bookReturn && (
        <div className="result">
          <br />
          <span style={{ fontWeight: "bold" }}>Title:</span> {bookReturn.title}{" "}
          <br />
          <span>Author:</span> {bookReturn.author} <br />
          {bookReturn.borrow_status === "borrowed" && (
            <>
              <strong>Borrow Date:</strong> {bookReturn.borrow_date} <br />
            </>
          )}
        </div>
      )}

      <div className="input-group">
        <input
          type="text"
          value={deleteID}
          onChange={(e) => setDeleteID(e.target.value)}
          placeholder="Enter Book ID"
        />
        <button onClick={deleteBook}>Delete Book</button>
        {deleteMessage && <div className="message">{deleteMessage}</div>}
      </div>
    </div>
  );
}
export default Library;
