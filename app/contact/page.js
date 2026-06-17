"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } else {
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <h1 style={{ fontFamily: "serif", fontSize: "36px", marginBottom: "8px", color: "#f9fafb" }}>Contact Us</h1>
        <p style={{ color: "#8a8178", marginBottom: "32px" }}>Reach us directly — we respond within 24 hours.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text" placeholder="Your name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid #2a2520", background: "#161310", color: "#f9fafb", fontSize: "15px" }}
          />
          <input
            type="email" placeholder="Your email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid #2a2520", background: "#161310", color: "#f9fafb", fontSize: "15px" }}
          />
          <textarea
            placeholder="Your message" required rows={5}
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid #2a2520", background: "#161310", color: "#f9fafb", fontSize: "15px", resize: "vertical" }}
          />
          <button type="submit" disabled={status === "sending"}
            style={{ padding: "14px", borderRadius: "10px", background: "#d97706", color: "#fff", fontSize: "15px", fontWeight: "600", border: "none", cursor: "pointer" }}>
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
          {status === "success" && <p style={{ color: "#4ade80", textAlign: "center" }}>Message sent! We'll be in touch.</p>}
          {status === "error" && <p style={{ color: "#f87171", textAlign: "center" }}>Something went wrong. Try again.</p>}
        </form>
      </div>
    </div>
  );
}
