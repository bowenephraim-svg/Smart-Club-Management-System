if (!window.__victoryThemeInitialized) (() => {
	window.__victoryThemeInitialized = true;
	const themeKey = 'victory-theme';

	function setTheme(theme) {
		const dark = theme === 'dark';
		document.body.classList.toggle('dark-theme', dark);
		// Older pages used a second, incompatible light-theme switch.  Removing
		// it here gives every portal one source of truth for its saved theme.
		document.body.classList.remove('light-theme');
		document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

		document.querySelectorAll('#darkModeBtn, #studentThemeBtn, [data-theme-toggle]').forEach((button) => {
			button.setAttribute('aria-pressed', String(dark));
			button.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
			button.setAttribute('title', dark ? 'Use light theme' : 'Use dark theme');
			const icon = button.querySelector('i');
			if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
		});

		localStorage.setItem(themeKey, dark ? 'dark' : 'light');
	}

	function addLegacyStudentControls() {
		document.querySelectorAll('.student-layout .topbar').forEach((topbar) => {
			if (topbar.querySelector('[data-theme-toggle]')) return;

			const actions = document.createElement('div');
			actions.className = 'student-topbar-actions';
			actions.innerHTML = `
				<a class="student-nav-btn" href="/student/notifications" aria-label="Notifications" title="Notifications">
					<i class="fas fa-bell"></i>
				</a>
				<button class="student-nav-btn" type="button" data-theme-toggle aria-label="Use dark theme" title="Use dark theme">
					<i class="fas fa-moon"></i>
				</button>
				<a class="student-nav-btn" href="/auth/logout" aria-label="Log out" title="Log out">
					<i class="fas fa-sign-out-alt"></i>
				</a>
			`;
			topbar.appendChild(actions);
		});
	}

	function initMobileNavigation() {
		const sidebar = document.querySelector('.student-layout .sidebar, .student-app .sidebar');
		const buttons = document.querySelectorAll('#studentMobileMenuBtn');
		buttons.forEach((button) => button.addEventListener('click', () => sidebar?.classList.toggle('student-sidebar-open')));
	}

	document.addEventListener('DOMContentLoaded', () => {
		addLegacyStudentControls();
		initMobileNavigation();

		const savedTheme = localStorage.getItem(themeKey);
		setTheme(savedTheme === 'dark' ? 'dark' : 'light');

		document.querySelectorAll('#darkModeBtn, #studentThemeBtn, [data-theme-toggle]').forEach((button) => {
			button.addEventListener('click', () => {
				setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
			});
		});
	});
})();
