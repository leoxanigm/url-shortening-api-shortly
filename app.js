document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('link-input');
  const inputErrorEl = document.getElementById('error');
  const inputContainerEl = document.querySelector('.input-container .input');
  const submitEl = document.getElementById('shorten');
  const linkCardsContainer = document.getElementsByClassName('link-cards')[0];
  const shortlyLocalStorage = localStorage;

  let currentLocalData;
  let currentInput;

  try {
    currentLocalData = JSON.parse(shortlyLocalStorage.links);
  } catch (err) {
    shortlyLocalStorage.links = JSON.stringify([]);
    currentLocalData = JSON.parse(shortlyLocalStorage.links);
  }

  populateResult();

  submitEl.addEventListener('click', submitData);

  inputEl.addEventListener('keyup', e => {
    e.preventDefault();

    if (e.key === 'Enter') {
      submitData();
    }
  });

  function submitData() {
    // Defining a simple regex for simple testing purposes and will not work
    // universally. For example, an input of https://example-link.com will not work.
    // Improve on live production

    const regTest = /(^http+s?:\/\/)(www.){0,1}([a-zA-Z0-9]*)(\.)([a-z]{2,})(\/{0,1})/im;
    currentInput = inputEl.value;

    inputContainerEl.classList.remove('error');
    inputErrorEl.textContent = '';

    if (currentInput === '' || !regTest.test(currentInput)) {
      inputContainerEl.classList.add('error');
      inputErrorEl.textContent =
        'Please enter a valid link. For example, https://example.com';
    } else {
      let requestBody = {
        url: currentInput
      };

      fetch('https://rel.ink/api/links/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
        .then(resp => {
          if (!resp.ok) {
            throw new Error('Network responce was not ok');
          }
          inputEl.value = '';
          return resp.json();
        })
        .then(data => populateResult('new', data, currentInput))
        .catch(err => console.log(err));
    }
  }

  function populateResult(type, data) {
    inputEl.value = '';

    if (type === 'new') {
      let hashId = data.hashid;
      let respURL = data.url;
      let timeStamp = data.created_at.toString();

      currentLocalData.unshift({
        hashId: hashId,
        originalURL: respURL,
        timeStamp: timeStamp
      });

      shortlyLocalStorage.links = JSON.stringify(currentLocalData);
    }

    while (linkCardsContainer.lastChild) {
      linkCardsContainer.removeChild(linkCardsContainer.lastChild);
    }

    if (currentLocalData) {
      currentLocalData.forEach(linkData => {
        linkCardsContainer.innerHTML += `
          <div class="link-card">
            <a href="${linkData.originalURL}" class="original" target="_short">${linkData.originalURL}</a>
            <a href="https://rel.ink/${linkData.hashId}" class="shortened" data-hash="${linkData.hashId}" target="_short">https://rel.ink/${linkData.hashId}</a>
            <button class="btn" id="copy">Copy</button>
            <button class="btn" id="delete" data-time="${linkData.timeStamp}">delete</button>
          </div>
        `;
      });
    }
  }

  linkCardsContainer.addEventListener('click', e => {
    if (e.target.hasAttributes('data-time') && e.target.id === 'delete') {
      let deleteBtn = e.target;
      let deleteTimeStamp = deleteBtn.getAttribute('data-time');
      let deleteHash = deleteBtn.parentNode
        .querySelector('.shortened')
        .getAttribute('data-hash');

      deleteBtn.parentNode.parentNode.removeChild(deleteBtn.parentNode);

      currentLocalData = currentLocalData.filter(linkData => {
        return (
          linkData.hashId !== deleteHash &&
          linkData.timeStamp !== deleteTimeStamp
        );
      });

      shortlyLocalStorage.links = JSON.stringify(currentLocalData);
    } else if (e.target.id === 'copy') {
      let copyBtn = e.target;

      let textAreaCopyEl = document.createElement('textarea');
      textAreaCopyEl.value = copyBtn.parentNode.querySelector(
        '.shortened'
      ).href;
      textAreaCopyEl.id = 'copy-el-text-area';
      copyBtn.parentNode.appendChild(textAreaCopyEl);
      textAreaCopyEl.select();
      textAreaCopyEl.setSelectionRange(0, textAreaCopyEl.value.length);
      document.execCommand('copy');
    }
  });
});