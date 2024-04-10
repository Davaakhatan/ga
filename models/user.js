import mongoose from "mongoose"

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter a user name"]
        },
        age: {
            type: Number,
            required: true,
            default: 20
        },
        country: {
            type: String,
            required: [true, "Please enter a country name"]
        }
    },
    {
        timestamps: true
    }
)


const User = mongoose.model('User', userSchema);

export default User;