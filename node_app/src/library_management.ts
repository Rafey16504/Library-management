const express = require("express");
import { v4 as uuidv4 } from "uuid";
import { CreateBookType, CreateBookTypeSchema } from "./types/book";
import { ZodError } from "zod";
import { convertToReadableError } from "./zod-mapping";
const nodemailer = require("nodemailer");
export const bookRouter = express.Router();

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
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].id == id) {
      accounts[i].code = verification_code[id];
    }
  }
  console.log(`Received email to send: ${email}`);
  if (!email) {
    return res.send("Email is required");
  }
  try {
    await sendEmail(email, verification_code[id]);
    return res.send({ message: verification_code[id] });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.send("Could not send email!");
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

bookRouter.post("/library/:id", (req: any, res: any) => {
  try {
    const account = req.params.id;
    const { title, author } = req.body;
    const body = validate(req.body);

    for (let i = 0; i < books.length; i++) {
      if (books[i].title == body.title && books[i].author == body.author)
        return res
          .status(400)
          .send({ success: false, error: "Book Already Exists!" });
    }
    body.id = uuidv4().replace(/-/g, "");
    body.user = account;
    body.borrow_status = BookStatus.NOT_BORROWED;
    books.push(body);

    return res.send(body);
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  }
});

bookRouter.get("/library", (req: Request, res: any) => {
  if (books.length == 0) return res.send(books);
  return res.send(books);
});

bookRouter.get("/library/:id", (req: any, res: any) => {
  if (books.length == 0)
    return res.status(400).send({ success: false, error: "No Book exists!" });
  const id = req.params.id;

  const book = books.find((b) => b.id === id);
  if (!book)
    return res
      .status(400)
      .send({ success: false, error: "No Book with this ID exists!" });
  const index = books.indexOf(book);
  return res.send(books[index]);
});

bookRouter.delete("/library/:accountid/:id", (req: any, res: any) => {
  if (books.length == 0)
    return res.status(400).send({ success: false, error: "No Book exists!" });
  const id = req.params.id;
  const account = req.params.accountid
  const book = books.find((b) => b.id === id);
  if (!book)
    return res
      .status(400)
      .send({ success: false, error: "No Book with this ID exists!" });
  if(book.user === account)
  {
    const index = books.indexOf(book);
    const deleted_book = books[index];
    books.splice(index, 1);
    return res.send({
      success: true,
      message: "Book removed!",
      book_details: deleted_book,
    });
  }
  else{
    return res.send({ success: false, error: "Only the user that added the book can delete it!" });
  }
  
});

bookRouter.delete("/library", (req: any, res: any) => {
  res.status(400).send({ success: false, error: "ID is required" });
});

bookRouter.post("/library/borrow/:id", (req: any, res: any) => {
  if (books.length == 0)
    return res.status(400).send({ success: false, error: "No Book exists!" });
  const id = req.params.id;
  const { user } = req.body;
  const book = books.find((b) => b.id === id);
  if (!book)
    return res
      .status(400)
      .send({ success: false, error: "No Book with this ID exists!" });
  const index = books.indexOf(book);
  if (books[index].borrow_date)
    return res.send({
      success: true,
      message: "Book already borrowed!",
      book_details: books[index],
    });

  const currentTime = new Date().toUTCString();
  books[index].borrow_date = currentTime;
  books[index].borrow_status = BookStatus.BORROWED;
  books[index].borrow_user = user;
  return res.send(books[index]);
});

bookRouter.post("/library/borrow", (req: any, res: any) => {
  res.status(400).send({ success: false, error: "ID is required" });
});

bookRouter.post("/library/return/:accountid/:id", (req: any, res: any) => {
  if (books.length == 0)
    return res.status(400).send({ success: false, error: "No Book exists!" });
  const id = req.params.id;
  const account = req.params.accountid
  const book = books.find((b) => b.id === id);
  if (!book)
    return res.status(400).send({ success: false, error: "No Book with this ID exists!" });
  const index = books.indexOf(book);
  if (!books[index].borrow_date)
    return res.send({
        success: false,
        error: "Book cannot be returned. You do not have it!",
      });
  if(book.borrow_user===account){
    books[index].borrow_date = null;
    books[index].borrow_status = BookStatus.NOT_BORROWED;
    books[index].borrow_user = null;
    return res.send(books[index]);
  }
    else{
      return res.send({error:"Failed to return!"})
    }
  
  
});

bookRouter.post("/library/return", (req: any, res: any) => {
  res.status(400).send({ success: false, error: "ID is required" });
});

bookRouter.post("/sign-up", (req: any, res: any) => {
  try {
    const { user, pass, email } = req.body;

    const existingUser = accounts.find(
      (account: any) => account.username === user
    );
    if (existingUser in accounts)
      return res.status(409).send({ error: "Username already exists" });

    const newAccount = {
      id: uuidv4().replace(/-/g, ""),
      username: user,
      pass: pass,
      email: email,
    };
    accounts.push(newAccount);

    return res.status(200).send(newAccount);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error });
  }
});

bookRouter.post("/sign-in", (req: any, res: any) => {
  try {
    console.log(accounts);
    const { user, pass } = req.body;
    const account = accounts.find(
      (u: any) => u.username === user && u.pass === pass
    );
    if (account) {
      res.status(200).send({ message: "Sign-in successful" });
    } else {
      res.status(401).send({ message: "Invalid credentials" });
    }
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ error: error.message });
  }
});
