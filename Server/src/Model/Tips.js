import mongoose from "mongoose";

const tipSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Mua Sắm', 'Bảo Quản', 'Nấu Ăn', 'Kiến Thức', 'Làm Vườn']
  },
  image: { 
    type: String
  },
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    default: 'DNC Food'
  },
  authorTitle: { 
    type: String, 
    default: 'Chuyên gia dinh dưỡng'
  },
  tags: { 
    type: [String]
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  datePublished: { 
    type: Date, 
    default: Date.now 
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Tip = mongoose.model("Tip", tipSchema);

export default Tip; 