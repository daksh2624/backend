import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,//the user who is subs
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,//the channels who is being subscribed
            ref: "User"
        }
    }, 
    {
        timestamps : true
    });


export const Subscription = mongoose.model("Subscription", subscriptionSchema)
