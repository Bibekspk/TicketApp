import express, { NextFunction, Request, Response } from "express";
import { requireAuth, validateRequest } from "@sporganization/commonauth";
import { body } from "express-validator";
import { Ticket } from "../models/tickets";
import { TicketCreatedPublisher } from "../events/publishers/ticket-created.publisher";
import { natsWrapper } from "../nats-wrapper";
const router = express.Router();

router.post(
  "/api/tickets",
  requireAuth,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("price").isFloat({ gt: 0 }).withMessage("Price is required"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, price } = req.body;
    const ticket = Ticket.build({
      title,
      price,
      userId: req.user!.id,
    });
    console.log("ticket hahahaha");
    await ticket.save();

    new TicketCreatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.status(200).send(ticket);
  }
);

export { router as createTicketRouter };