const dateInput = document.querySelector<HTMLInputElement>('#dob')!;
const iconBtn   = document.querySelector<HTMLButtonElement>('#openDob')!;

iconBtn.addEventListener('click', () => {
  try {
    if ('showPicker' in HTMLInputElement.prototype) {
      dateInput.showPicker();          // opens the built-in calendar
    } else {
      dateInput.focus();               // basic fallback
      // dateInput.click(); // optional: helps on some Android/desktop
    }
  } catch (err) {
    dateInput.focus();
  }
});