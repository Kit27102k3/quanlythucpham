"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

const contactSchema = new _mongoose.default.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isReplied: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Contact = _mongoose.default.model("Contact", contactSchema);var _default = exports.default =

Contact;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbW9uZ29vc2UiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsImNvbnRhY3RTY2hlbWEiLCJtb25nb29zZSIsIlNjaGVtYSIsIm5hbWUiLCJ0eXBlIiwiU3RyaW5nIiwicmVxdWlyZWQiLCJlbWFpbCIsIm1lc3NhZ2UiLCJwaG9uZSIsImlzUmVhZCIsIkJvb2xlYW4iLCJkZWZhdWx0IiwiaXNSZXBsaWVkIiwidGltZXN0YW1wcyIsIkNvbnRhY3QiLCJtb2RlbCIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Nb2RlbC9Db250YWN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb25nb29zZSBmcm9tIFwibW9uZ29vc2VcIjtcclxuXHJcbmNvbnN0IGNvbnRhY3RTY2hlbWEgPSBuZXcgbW9uZ29vc2UuU2NoZW1hKFxyXG4gIHtcclxuICAgIG5hbWU6IHtcclxuICAgICAgdHlwZTogU3RyaW5nLFxyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICBlbWFpbDoge1xyXG4gICAgICB0eXBlOiBTdHJpbmcsXHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgfSxcclxuICAgIG1lc3NhZ2U6IHtcclxuICAgICAgdHlwZTogU3RyaW5nLFxyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICBwaG9uZToge1xyXG4gICAgICB0eXBlOiBTdHJpbmcsXHJcbiAgICB9LFxyXG4gICAgaXNSZWFkOiB7XHJcbiAgICAgIHR5cGU6IEJvb2xlYW4sXHJcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxyXG4gICAgfSxcclxuICAgIGlzUmVwbGllZDoge1xyXG4gICAgICB0eXBlOiBCb29sZWFuLFxyXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7IHRpbWVzdGFtcHM6IHRydWUgfVxyXG4pO1xyXG5cclxuY29uc3QgQ29udGFjdCA9IG1vbmdvb3NlLm1vZGVsKFwiQ29udGFjdFwiLCBjb250YWN0U2NoZW1hKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvbnRhY3Q7ICJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxNQUFNQyxhQUFhLEdBQUcsSUFBSUMsaUJBQVEsQ0FBQ0MsTUFBTTtFQUN2QztJQUNFQyxJQUFJLEVBQUU7TUFDSkMsSUFBSSxFQUFFQyxNQUFNO01BQ1pDLFFBQVEsRUFBRTtJQUNaLENBQUM7SUFDREMsS0FBSyxFQUFFO01BQ0xILElBQUksRUFBRUMsTUFBTTtNQUNaQyxRQUFRLEVBQUU7SUFDWixDQUFDO0lBQ0RFLE9BQU8sRUFBRTtNQUNQSixJQUFJLEVBQUVDLE1BQU07TUFDWkMsUUFBUSxFQUFFO0lBQ1osQ0FBQztJQUNERyxLQUFLLEVBQUU7TUFDTEwsSUFBSSxFQUFFQztJQUNSLENBQUM7SUFDREssTUFBTSxFQUFFO01BQ05OLElBQUksRUFBRU8sT0FBTztNQUNiQyxPQUFPLEVBQUU7SUFDWCxDQUFDO0lBQ0RDLFNBQVMsRUFBRTtNQUNUVCxJQUFJLEVBQUVPLE9BQU87TUFDYkMsT0FBTyxFQUFFO0lBQ1g7RUFDRixDQUFDO0VBQ0QsRUFBRUUsVUFBVSxFQUFFLElBQUksQ0FBQztBQUNyQixDQUFDOztBQUVELE1BQU1DLE9BQU8sR0FBR2QsaUJBQVEsQ0FBQ2UsS0FBSyxDQUFDLFNBQVMsRUFBRWhCLGFBQWEsQ0FBQyxDQUFDLElBQUFpQixRQUFBLEdBQUFDLE9BQUEsQ0FBQU4sT0FBQTs7QUFFMUNHLE9BQU8iLCJpZ25vcmVMaXN0IjpbXX0=