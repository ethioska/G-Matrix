function sendMessage() {
    let input = document.getElementById('chat-input');
    let chatBox = document.getElementById('chat-messages');
    if (input.value.trim() !== "") {
        let p = document.createElement('p');
        p.innerHTML = `<span style="color:#007bff;">You:</span> ${input.value}`;
        chatBox.appendChild(p);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
function toggleMic() { alert("ድምፅ ለማስተላለፍ Agora App ID ያስፈልጋል።"); }
function showGifts() { alert("ስጦታ ለመላክ በቂ ኮይን የሎትም።"); }
