import React from "react";
import { Html, Section, Row, Text, Img, Container } from "@react-email/components";

const MyEmail = ({ name, code }) => {
    const textStyles = {
        fontSize: 16,
        lineHeight: "24px",
        color: "#414141",
        textAlign: "left",
    };
    return (
        <Html style={{ margin: 0, width: "100%" }}>
            <Section
                style={{
                    margin: 0,
                    padding: "30px 0px",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#F0F2F3",
                }}
                className="email-container"
            >
                <Section
                    style={{
                        textAlign: "center",
                        margin: "auto",
                        maxWidth: "600px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                    className="email-content"
                >
                    <Row>
                        <Img
                            src="https://studycompass.s3.us-east-1.amazonaws.com/email/Header.png"
                            style={{
                                width: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </Row>
                    <Section style={{ padding: "0 20px 20px 20px" }}>
                        <Row>
                            <Text
                                style={{
                                    margin: "0px",
                                    fontSize: 20,
                                    lineHeight: "28px",
                                    fontWeight: 600,
                                    color: "#414141",
                                }}
                            >
                                Forgot Your Password?
                            </Text>
                            <Container style={{ padding: "0 10%", boxSizing: "border-box" }}>
                                <Text style={textStyles}>Hi, {name}!</Text>
                                <Text style={textStyles}>
                                    It looks like you requested a password reset for your Study Compass account. No worries, we're here to help you get back on track!
                                </Text>
                                <Text style={textStyles}>
                                    Please use the following verification code to reset your password:
                                </Text>
                                <Text
                                    style={{
                                        ...textStyles,
                                        fontSize: 24,
                                        fontWeight: 600,
                                        textAlign: "center",
                                        padding: "15px",
                                        margin: "15px 0",
                                        backgroundColor: "#f5f5f5",
                                        borderRadius: "5px",
                                        letterSpacing: "2px",
                                    }}
                                >
                                    {code}
                                </Text>
                                <Text style={textStyles}>
                                    For security reasons, this code will expire in 30 minutes. If you didn't request this password reset, you can safely ignore this email.
                                </Text>
                                <Text style={textStyles}>Happy Studying!</Text>
                            </Container>
                        </Row>
                    </Section>
                </Section>
            </Section>
        </Html>
    );
};

export default MyEmail;
