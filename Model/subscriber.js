import mongoose from "mongoose";

const subscriberSchema = mongoose.Schema(
    {
        email: {
            type: email,
            required: true,
            unique: true,
            trim: true
        },
    },
    {
        timestamps: {
            createAt: true,
            updatedAt: false
        }
    }
)
// ================== subscriber schema ==================

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;