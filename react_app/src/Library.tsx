import "./App.css";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

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
  const [isBookFetched, setIsBookFetched] = useState(false);

  const location = useLocation();
  const { loggedInAccount } = location.state || {};

  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File|null>(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [fileURL, setFileURL] = useState<string|undefined>(undefined);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };


  const handleFileChange = (event:any) => {
    const file = event.target.files[0];

    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setFileName(file.name);
      setFileURL(url);
    } else {
      setSelectedFile(null);
      setFileName('No file chosen');
      setFileURL(undefined);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileName('No file chosen');
    setFileURL(undefined);
  };

  useEffect(() => {
    return () => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [fileURL]);

  const handleAddBook = async () => {
    if (title && author ) {
      try {
        // const formData = new FormData();

        const data = await axios.post(
          `http://localhost:8100/library/${loggedInAccount}`,{
            title,
            author}
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
        if (error) {
          setAddMessage(error);
          console.log(error);
          setTimeout(() => {
            setAddMessage("");
          }, 4000);
        }
      }
    } else {
      setAddMessage("All fields are required.");
      setTimeout(() => {
        setAddMessage("");
      }, 4000);
    }
  };  
  
  const fetchBookById = async () => {
    if(!id)
    {
      setFetchMessage("Please enter a valid ID!")
      setBook(null);
      setIsBookFetched(false);
      setTimeout(() => {
        setFetchMessage("");
      }, 4000);
      return
    }
    setBook(null);
    setIsBookFetched(false);
    try{
      const response = await axios.get(`http://localhost:8100/library/${id}`)
    
      setBook(response.data)
      setIsBookFetched(true)
      if(book === null)
        setIsBookFetched(false)
    }
    catch (error) {
      console.error("Error fetching book data:", error);
      setFetchMessage("No Book with this ID exists");
      setTimeout(() => {
        setFetchMessage("");
      }, 4000);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get("http://localhost:8100/library");
    
      setBooks(response.data);
      console.log(books);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const borrowBook = async () => {
    setBookBorrow(null);
    try {
      const { data } = await axios.post(
        `http://localhost:8100/library/borrow/${borrowID}`,
        {
          user: loggedInAccount,
        }
      );
        setBookBorrow(data);
        fetchBooks();
        setBorrowMessage("Book borrowed successfully!");
        setTimeout(() => {
          setBorrowMessage("");
        }, 4000);
      
    } catch (error:any) {
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 401:
            setBorrowMessage('Book has already been borrowed.');
            break;
          case 400:
            setDeleteMessage('No Book with this ID exists');
            break;
        }
        setTimeout(() => {
          setDeleteMessage('');
        }, 4000);
      }else{
        console.log("Error while borrowing!", error);
        setBorrowMessage(
          "Could not borrow book. Book with this ID does not exist."
        );
        setTimeout(() => {
          setBorrowMessage("");
        }, 4000);
      }
      
    }
  };

  const returnBook = async () => {
    try {
        let retBook = null;
        for(let i = 0; i < books.length; i++) {
            if(books[i].id === returnID) {
                retBook = books[i];
                break; 
            }
        }
        if (!retBook) {
            setReturnMessage("No book with such ID exists!");
        } else if (retBook.borrow_status === "not borrowed") {
            setReturnMessage("Book hasn't been borrowed yet!");
        } else if (retBook.borrow_status === "borrowed") {
            const {data} = await axios.post(`http://localhost:8100/library/return/${loggedInAccount}/${returnID}`);
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
          `http://localhost:8100/library/${loggedInAccount}/${deleteID}`
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
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 401:
            setDeleteMessage('Unauthorized: Only the user that added the book can delete it.');
            break;
          case 404:
            setDeleteMessage('Book not found.');
            break;
        }
        setTimeout(() => {
          setDeleteMessage('');
        }, 4000);
      }
      else {
        console.error('Error fetching book:', error);
        setDeleteMessage('An unexpected error occurred.');
        setTimeout(() => {
          setDeleteMessage('');
        }, 4000);
      }
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
      <button onClick={toggleDropdown}>
        {`User: ${loggedInAccount}`}
      </button>
      {isDropdownOpen && (
        <ul className="dropdown-menu">
          <li><Link to="/">Logout</Link> </li>
        </ul>
      )}
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
          {/* <div className="file-upload">
      <input
        type="file"
        id="file-input"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-input" className="custom-file-upload">
        Choose File
      </label>
      {selectedFile ? (
        <a 
        href={fileURL} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="file-name"
        download={selectedFile.name}
        >
          {fileName}
        </a>
      ) : (
        <span className="file-name">{fileName}</span>
      )}
      {selectedFile && (
        <button className="remove-file" onClick={handleRemoveFile}>
          &times;
        </button>
      )} */}
    {/* </div> */}
        
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

      {isBookFetched && book && (
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
