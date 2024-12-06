// Validate name
export const validateName = (name, minLength = 3) => {
	if (!name) {
		return 'Name is required';
	}

	return name.trim().length >= minLength ? '' : 'Please enter a valid name';
};

// Validate email
export const validateEmail = (email) => {
	if (!email) {
		return 'Email is required';
	}

	if (!email.includes('@')) {
		return 'Email must contain "@"';
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return 'Please enter a valid email address';
	}

	return '';
};

// Validate if the password meets the minimum length requirement
export const validatePassword = (password, minLength = 6) => {
	if (/\s/.test(password)) {
		return 'Password must not contain spaces';
	}

	return password.length >= minLength ? '' : `Password must be at least ${minLength} characters`;
};

// Validate if the password and confirm password match
export const validateConfirmPassword = (password, confirmPassword) => {
	return password === confirmPassword ? '' : 'Passwords do not match';
};
