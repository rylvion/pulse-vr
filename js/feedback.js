const form = document.getElementById("feedback-form");
const statusBox = document.getElementById("feedback-status");

if (form) {
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const name = document.getElementById("name").value.trim();
		const email = document.getElementById("email").value.trim();
		const subject = document.getElementById("subject").value.trim();
		const message = document.getElementById("message").value.trim();

		if (!name || !email || !subject || !message) {
			statusBox.textContent = "Please fill in all fields.";
			statusBox.style.color = "var(--error, #d32f2f)";
			return;
		}

		if (!validateEmail(email)) {
			statusBox.textContent = "Please enter a valid email address.";
			statusBox.style.color = "var(--error, #d32f2f)";
			return;
		}

		const mailtoLink = `mailto:support@pulsevr.example?subject=${encodeURIComponent(
			subject
		)}&body=${encodeURIComponent(
			`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
		)}`;

		statusBox.textContent = "Opening your email client...";
		statusBox.style.color = "var(--success, #1d8f67)";

		setTimeout(() => {
			window.location.href = mailtoLink;
			form.reset();
		}, 800);
	});
}

function validateEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}