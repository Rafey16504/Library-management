const express = require("express");
const multer  = require('multer');
import { Buffer } from 'buffer';
import path from 'path'
const storage = multer.diskStorage({
  destination: function (req:any, file:any, cb:any) {
    cb(null, 'uploads/'); // Set your desired upload directory
  },
  filename: function (req:any, file:any, cb:any) {
    // Create a unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });
import { v4 as uuidv4 } from "uuid";
import { CreateBookType, CreateBookTypeSchema } from "./types/book";
import { ZodError } from "zod";
import { convertToReadableError } from "./zod-mapping";
import { error } from "console";
const nodemailer = require("nodemailer");
export const bookRouter = express.Router();
const client = require('./db') 

const books: CreateBookType[] = [];
const accounts: any = [];
let verification_code: any = [];
enum BookStatus {
  BORROWED = "borrowed",
  NOT_BORROWED = "not borrowed",
}

function sendEmail(email: any, code: any) {
  return new Promise((resolve: any, reject: any) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "abdulrafey16504@gmail.com",
        pass: "loll bquz miku ycfx",
      },
    });
    const mail_configs = {
      from: "abdulrafey16504@gmail.com",
      to: email,
      subject: "Verification Code",
      text: `${code}`,
    };
    transporter.sendMail(mail_configs, (error: any, info: any) => {
      if (error) {
        console.error("Error sending email:", error);
        return reject({ message: `An error has occurred: ${error.message}` });
      }
      console.log("Email sent:", info);
      return resolve({ message: `Email sent successfully` });
    });
  });
}

bookRouter.post("/send-email/:id", async (req: any, res: any) => {
  const { email } = req.body;
  const id = req.params.id;
  verification_code[id] = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  
  try {
    let email_query = `UPDATE accounts SET code = $1 WHERE id = $2 RETURNING *`
    const result = await client.query(email_query, [verification_code[id], id]);
    
    await sendEmail(email, verification_code[id]);
    
    return res.send({ message: verification_code[id] });
  } catch (error) {
    
    console.error('Error sending email:', error);
    return res.status(500).send('Could not send email!');
  } 
});

const validate = (body: any): CreateBookType => {
  try {
    return CreateBookTypeSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(convertToReadableError(error));
    } else {
      throw error;
    }
  }
};

bookRouter.post("/library/:id", async (req: any, res: any) => {
  
  try {
    // const file = req.file
    const account = req.params.id;
    const body = validate(req.body);
    // const file_path = file.path
    const book_query = `SELECT * FROM books WHERE title = $1 AND author = $2`
    const existingBooks = await client.query(book_query, [body.title, body.author]);

    if (existingBooks.rows.length > 0) {
      return res.send({ success: false, error: 'Book Already Exists!' });
    }

    body.id = uuidv4().replace(/-/g, '');
    body.user = account;
    body.borrow_status = BookStatus.NOT_BORROWED;
    const insertbook_query = `INSERT INTO books(id, title, author, book_owner, borrow_status) VALUES($1, $2, $3, $4, $5)`
    await client.query(insertbook_query,[body.id, body.title, body.author, body.user, body.borrow_status]);
    
    return res.send(body);

  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  } 
});

bookRouter.get("/library", async (req: Request, res: any) => {
  
  try {
    let get_query = `SELECT * FROM books`
    const result = await client.query(get_query);
    if (result.rows.length === 0) {
      console.log('No books found in the database.');
    }
    return res.json(result.rows);
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  } 
});

// bookRouter.get("/library/book-file/:id", async (req: any, res: any) => {
//   try {
//     const bookId = req.params.id;
//     const get_query = `SELECT book_file FROM books WHERE id = $1`;
//     const result = await client.query(get_query, [bookId]);
    
//     if (result.rows.length === 0) {
//       return res.status(400).send({ error: 'File not found' });
//     }

//     const hexData = result.rows[0].book_file;
//     const fileData = Buffer.from(hexData, 'hex');

//     res.setHeader('Content-Type', 'application/docx');
//     res.send(fileData);
//   } catch (error: any) {
//     console.log(error);
//     return res.status(400).send({ error: error.message });
//   }
// });

bookRouter.get("/library/:id", async (req: any, res: any) => {
  
  try {
    const id = req.params.id;
    const result = await client.query(`SELECT * FROM books WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(400).send({ success: false, error: 'No Book with this ID exists!' });
    }

    return res.send(result.rows[0]);
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  }
});

bookRouter.delete('/library/:username/:id', async (req: any, res: any) => {
  
  try {
    const { username, id } = req.params;
    const result = await client.query(`SELECT * FROM books WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).send({ success: false, error: 'No Book with this ID exists!' });
    }
    const book = result.rows[0];
    if (book.book_owner !== username) {
      return res.status(401).send({ success: false, error: 'Only the user that added the book can delete it!' });
    }
    await client.query('DELETE FROM books WHERE id = $1', [id]);
    return res.send({
      success: true,
      message: 'Book removed!',
      book_details: book,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  } 
});

bookRouter.delete('/library', (req: any, res: any) => {
  res.status(400).send({ success: false, error: 'ID is required' });
});

bookRouter.post('/library/borrow/:id', async (req: any, res: any) => {
  
  try {
    const id = req.params.id;
    const { user } = req.body;
    const result = await client.query(`SELECT * FROM books WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(400).send({ success: false, error: 'No Book with this ID exists!' });
    }
    const book = result.rows[0]; 
    if (book.borrow_status === BookStatus.BORROWED) {
      return res.status(401).send({ success: true, message: 'Book already borrowed!', book_details: book });
    }
    const currentTime = new Date().toISOString();
    await client.query(`UPDATE books SET borrow_date = $1, borrow_status = $2, borrow_user = $3 WHERE id = $4`, [currentTime, BookStatus.BORROWED, user, id]);
    const updatedBook = (await client.query('SELECT * FROM books WHERE id = $1', [id])).rows[0];
    return res.send(updatedBook);
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  } 
});

bookRouter.post("/library/borrow", (req: any, res: any) => {
  res.status(400).send({ success: false, error: "ID is required" });
});

bookRouter.post('/library/return/:accountid/:id', async (req: any, res: any) => {
  
  try {
    const { accountid, id } = req.params;
    const result = await client.query(`SELECT * FROM books WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(400).send({ success: false, error: 'No Book with this ID exists!' });
    }
    const book = result.rows[0];
    if (!book.borrow_date) {
      return res.send({
        success: false,
        error: 'Book cannot be returned. You do not have it!',
      });
    }
    if (book.borrow_user === accountid) {
      await client.query(`UPDATE books SET borrow_date = NULL, borrow_status = $1, borrow_user = NULL WHERE id = $2`, [BookStatus.NOT_BORROWED, id]);
      const updatedBook = (await client.query(`SELECT * FROM books WHERE id = $1`, [id])).rows[0];
      return res.send(updatedBook);
    } else {
      return res.send({ success: false, error: 'Failed to return!' });
    }
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  } 
});

bookRouter.post('/library/return', (req: any, res: any) => {
  res.status(400).send({ success: false, error: 'ID is required' });
});

bookRouter.post('/sign-up', async (req: any, res: any) => {
  try {
    const { user, pass, email } = req.body;

    const user_query = `SELECT * FROM accounts WHERE username = $1`;
    const userResult = await client.query(user_query, [user]);

    if (userResult.rows.length > 0) {
      return res.send({ error: 'Username already exists' });
    }

    const email_query = `SELECT * FROM accounts WHERE email = $1`;
    const emailResult = await client.query(email_query, [email]);

    if (emailResult.rows.length > 0) {
      return res.send({ error: 'Email has already been registered' });
    }

    const newAccount = {
      id: uuidv4().replace(/-/g, ''),
      username: user,
      pass: pass,
      email: email,
    };
    return res.send({id: newAccount.id});
    
  } catch (error: any) {
    console.error("Error during sign-up:", error);
    return res.status(500).send({ error: error.message });
  }
});

bookRouter.post('/addbook',async (req:any,res:any)=>{

  const {id,username,pass,email} = req.body
  const insert_query = `INSERT INTO accounts(id, username, pass, email) VALUES($1, $2, $3, $4)`;
  await client.query(insert_query, [id, username, pass, email]);
  console.log("Insertion Successful");
  return
})
bookRouter.post('/sign-in', async (req: any, res: any) => {
  
  try {
    const { user, pass } = req.body;
    let signin_query = `SELECT * FROM accounts WHERE username = $1 AND pass = $2`;
    const result = await client.query(signin_query, [user, pass]);

    if (result.rows.length > 0) {
      return res.status(200).send({ message: 'Sign-in successful' });
    } else {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  } 
});