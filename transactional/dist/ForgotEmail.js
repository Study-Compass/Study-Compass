"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var components_1 = require("@react-email/components");
var MyEmail = function (_a) {
    var name = _a.name, code = _a.code;
    var textStyles = {
        fontSize: 16,
        lineHeight: "24px",
        color: "#414141",
        textAlign: "left",
    };
    return (react_1.default.createElement(components_1.Html, { style: { margin: 0, width: "100%" } },
        react_1.default.createElement(components_1.Section, { style: {
                margin: 0,
                padding: "30px 0px",
                width: "100%",
                height: "100%",
                backgroundColor: "#F0F2F3",
            }, className: "email-container" },
            react_1.default.createElement(components_1.Section, { style: {
                    textAlign: "center",
                    margin: "auto",
                    maxWidth: "600px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    overflow: "hidden",
                }, className: "email-content" },
                react_1.default.createElement(components_1.Row, null,
                    react_1.default.createElement(components_1.Img, { src: "https://studycompass.s3.us-east-1.amazonaws.com/email/Header.png", style: {
                            width: "100%",
                            objectFit: "cover",
                        } })),
                react_1.default.createElement(components_1.Section, { style: { padding: "0 20px 20px 20px" } },
                    react_1.default.createElement(components_1.Row, null,
                        react_1.default.createElement(components_1.Text, { style: {
                                margin: "0px",
                                fontSize: 20,
                                lineHeight: "28px",
                                fontWeight: 600,
                                color: "#414141",
                            } }, "Forgot Your Password?"),
                        react_1.default.createElement(components_1.Container, { style: { padding: "0 10%", boxSizing: "border-box" } },
                            react_1.default.createElement(components_1.Text, { style: textStyles },
                                "Hi, ",
                                name,
                                "!"),
                            react_1.default.createElement(components_1.Text, { style: textStyles }, "It looks like you requested a password reset for your Study Compass account. No worries, we're here to help you get back on track!"),
                            react_1.default.createElement(components_1.Text, { style: textStyles }, "Please use the following verification code to reset your password:"),
                            react_1.default.createElement(components_1.Text, { style: __assign(__assign({}, textStyles), { fontSize: 24, fontWeight: 600, textAlign: "center", padding: "15px", margin: "15px 0", backgroundColor: "#f5f5f5", borderRadius: "5px", letterSpacing: "2px" }) }, code),
                            react_1.default.createElement(components_1.Text, { style: textStyles }, "For security reasons, this code will expire in 30 minutes. If you didn't request this password reset, you can safely ignore this email."),
                            react_1.default.createElement(components_1.Text, { style: textStyles }, "Happy Studying!"))))))));
};
exports.default = MyEmail;
