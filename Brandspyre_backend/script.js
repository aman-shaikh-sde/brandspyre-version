document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const form = new FormData();
    const data = document.getElementById("data").value;
    const files = document.getElementById("files").files;
  
    form.append("data", data);
  
    for (let i = 0; i < files.length; i++) {
      form.append("files", files[i]); // multiple files with same key
    }
  
    try {
      let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJCUkNPREVfMDEvMDEiLCJyb2xlIjoic3VwZXJhZG1pbiIsImJyY29kZSI6IkJSQ09ERV8wMSIsImlhdCI6MTc1MTUzMTIyOSwiZXhwIjoxNzUxNjE3NjI5fQ.LuzJ_gUAmJidb_waFXwe0qCH1uIbNeKhKuVDSut_01A"
      const res = await fetch("http://localhost:3000/api/doc_meet/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
  
      const result = await res.json();
      document.getElementById("response").textContent = JSON.stringify(result, null, 2);
    } catch (err) {
      document.getElementById("response").textContent = "❌ Error: " + err.message;
    }
  });