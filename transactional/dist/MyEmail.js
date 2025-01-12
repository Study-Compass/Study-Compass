"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var components_1 = require("@react-email/components");
var MyEmail = function (_a) {
    var name = _a.name;
    return (react_1.default.createElement(components_1.Html, null,
        react_1.default.createElement(components_1.Section, { style: { marginTop: 16, marginBottom: 16 } },
            react_1.default.createElement(components_1.Row, null,
                react_1.default.createElement(components_1.Text, { style: {
                        margin: "0px",
                        fontSize: 20,
                        lineHeight: "28px",
                        fontWeight: 600,
                        color: "rgb(17,24,39)",
                    } },
                    "Elevate Outdoor Living ",
                    name),
                react_1.default.createElement(components_1.Text, { style: {
                        marginTop: 8,
                        fontSize: 16,
                        lineHeight: "24px",
                        color: "rgb(107,114,128)",
                    } }, "Take your outdoor space to new heights with our premium outdoor furniture, designed to elevate your alfresco experience.")),
            react_1.default.createElement(components_1.Row, { style: { marginTop: 16 } },
                react_1.default.createElement(components_1.Column, { colSpan: 1, style: {
                        width: "50%",
                        verticalAlign: "baseline",
                        paddingRight: 8,
                        boxSizing: "border-box",
                    } },
                    react_1.default.createElement(components_1.Img, { alt: "A picture of a pink background with various items laid out. Shoes, lipstick, sunglasses, some leaves, and part of a purse.", height: "180", src: "https://react.email/static/outdoor-living.jpg", style: {
                            width: "100%",
                            borderRadius: 8,
                            objectFit: "cover",
                        } }),
                    react_1.default.createElement(components_1.Text, { style: {
                            fontSize: 16,
                            lineHeight: "24px",
                            fontWeight: 600,
                            color: "rgb(79,70,229)",
                        } }, "What's new"),
                    react_1.default.createElement(components_1.Text, { style: {
                            margin: "0px",
                            fontSize: 20,
                            lineHeight: "28px",
                            fontWeight: 600,
                            color: "rgb(17,24,39)",
                        } }, "Multifunctional Marvels"),
                    react_1.default.createElement(components_1.Text, { style: {
                            marginBottom: "0px",
                            marginTop: 8,
                            fontSize: 16,
                            lineHeight: "24px",
                            color: "rgb(107,114,128)",
                        } }, "Discover the innovative world of multifunctional furniture, where style meets practicality, offering creative solutions for maximizing space and enhancing functionality in your home.")),
                react_1.default.createElement(components_1.Column, { colSpan: 1, style: {
                        width: "50%",
                        verticalAlign: "baseline",
                        paddingLeft: 8,
                        boxSizing: "border-box",
                    } },
                    react_1.default.createElement(components_1.Img, { alt: "A picture of a pink background with various items laid out. Shoes, lipstick, sunglasses, some leaves, and part of a purse.", height: "180", src: "https://react.email/static/outdoor-living.jpg", style: {
                            width: "100%",
                            borderRadius: 8,
                            objectFit: "cover",
                        } }),
                    react_1.default.createElement(components_1.Text, { style: {
                            fontSize: 16,
                            lineHeight: "24px",
                            fontWeight: 600,
                            color: "rgb(79,70,229)",
                        } }, "What's new"),
                    react_1.default.createElement(components_1.Text, { style: {
                            margin: "0px",
                            fontSize: 20,
                            lineHeight: "28px",
                            fontWeight: 600,
                            color: "rgb(17,24,39)",
                        } }, "Timeless Classics"),
                    react_1.default.createElement(components_1.Text, { style: {
                            marginBottom: "0px",
                            marginTop: 8,
                            fontSize: 16,
                            lineHeight: "24px",
                            color: "rgb(107,114,128)",
                        } }, "Step into the world of timeless classics as we explore iconic furniture pieces that have stood the test of time, adding enduring elegance and sophistication to any interior."))))));
};
exports.default = MyEmail;
