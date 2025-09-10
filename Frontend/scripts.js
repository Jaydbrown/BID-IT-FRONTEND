const introTextEl = document.getElementById('introText');
  const mainContent = document.getElementById('container');
  const fullText = "BID IT";
  let index = 0;

  function typeIntroText() {
    if (index < fullText.length) {
      introTextEl.textContent += fullText.charAt(index);
      index++;
      setTimeout(typeIntroText, 150); // typing speed
    } else {
      // After typing, wait 1.5s then show main content
      setTimeout(() => {
        document.getElementById('intro').style.display = 'none';
        document.body.style.overflow = 'auto'; // allow scrolling
        mainContent.classList.add('visible');
      }, 1500);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    typeIntroText();
  });


const sidebar = document.getElementById('mySidebar');
  const hamburger = document.getElementById('hamburger');
  const closeBtn = sidebar.querySelector('.closebtn');

  // Open sidebar
  function openSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.style.width = "100%";  // full screen on small devices
  } else {
    sidebar.style.width = "30%";   // partial on larger screens
  }
  sidebar.setAttribute('aria-hidden', 'false');
}


  // Close sidebar
  function closeSidebar() {
    sidebar.style.width = "0";
    sidebar.setAttribute('aria-hidden', 'true');
  }

  hamburger.addEventListener('click', openSidebar);
  hamburger.addEventListener('keydown', (e) => {
    if (e.key === "Enter" || e.key === " ") {
      openSidebar();
    }
  });

  closeBtn.addEventListener('click', closeSidebar);

  // Close sidebar when clicking outside links (on overlay background)
  sidebar.addEventListener('click', (e) => {
    if (e.target === sidebar) {
      closeSidebar();
    }
  });
  
  const part1 = "an E-commerce site for students";
  const part2 = "in Nigerian universities";
  const otherText = "BID IT";

  const displayPart1 = document.querySelector('.display-part1');
  const displayPart2 = document.querySelector('.display-part2');

  const typingSpeed = 100;
  const pauseTime = 3000;

  let mode = 0; // 0 = show split text, 1 = show BID IT
  let charIndex1 = 0;
  let charIndex2 = 0;
  let typing = true;
  let deleting = false;

  function typeSplitText() {
    if (typing) {
      // Type part1
      if (charIndex1 < part1.length) {
        displayPart1.textContent += part1.charAt(charIndex1);
        charIndex1++;
        setTimeout(typeSplitText, typingSpeed);
      }
      // Then type part2
      else if (charIndex2 < part2.length) {
        displayPart2.textContent += part2.charAt(charIndex2);
        charIndex2++;
        setTimeout(typeSplitText, typingSpeed);
      }
      else {
        typing = false;
        setTimeout(typeSplitText, pauseTime);
      }
    } else {
      // Delete part2 first
      if (charIndex2 > 0) {
        displayPart2.textContent = part2.substring(0, charIndex2 -1);
        charIndex2--;
        setTimeout(typeSplitText, typingSpeed / 2);
      }
      // Then delete part1
      else if (charIndex1 > 0) {
        displayPart1.textContent = part1.substring(0, charIndex1 -1);
        charIndex1--;
        setTimeout(typeSplitText, typingSpeed / 2);
      }
      else {
        // switch to other text or repeat split text
        if (mode === 0) {
          mode = 1;
          typingOtherText();
        } else {
          mode = 0;
          typing = true;
          setTimeout(typeSplitText, typingSpeed);
        }
      }
    }
  }

  // For typing the "BID IT" alone
  let bidItIndex = 0;
  let typingOther = true;

  function typingOtherText() {
    if (typingOther) {
      if (bidItIndex < otherText.length) {
        displayPart1.textContent += otherText.charAt(bidItIndex);
        bidItIndex++;
        setTimeout(typingOtherText, typingSpeed);
      } else {
        typingOther = false;
        setTimeout(typingOtherText, pauseTime);
      }
    } else {
      if (bidItIndex > 0) {
        displayPart1.textContent = otherText.substring(0, bidItIndex - 1);
        bidItIndex--;
        setTimeout(typingOtherText, typingSpeed / 2);
      } else {
        typingOther = true;
        displayPart2.textContent = "";
        typing = true;
        charIndex1 = 0;
        charIndex2 = 0;
        setTimeout(typeSplitText, typingSpeed);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    typeSplitText();
  });