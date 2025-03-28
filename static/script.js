const quizForm = document.getElementById("quizForm");
const quizContainer = document.getElementById("quizContainer");
const submitQuizBtn = document.getElementById("submitQuiz");
const resultDiv = document.getElementById("result");
let questions = [];

// Generate quiz questions
quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    quizContainer.innerHTML = "";
    resultDiv.innerHTML = "";
    submitQuizBtn.style.display = "none";

    const topic = document.getElementById("topic").value;
    const numQuestions = document.getElementById("numQuestions").value;
    const format = document.getElementById("format").value;
    const level = document.getElementById("level").value;

    try {
        const response = await fetch("https://blastrevise-api.onrender.com/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: topic, num_questions: numQuestions, question_format: format,question_level:level })
        });

        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("Parsed data:", data.questions);  // Logs the parsed data
        // Handle case when no data is returned or an error is returned
        if (data.error) {
            alert(`Error generating quiz: ${data.error}`);
            return;
        }

        if (!data.questions || data.questions.length === 0) {
            alert("No questions received.");
            return;
        }

        questions = data.questions;
        const cleanedData = questions.replace(/^```json\s*\n/, '').replace(/```$/, '').trim();
    
        console.log("this is questions",cleanedData)
        str_json = JSON.parse(cleanedData);
        str_json.forEach((q, index) => {
            
            let formattedQuestion = q.replace(/(\(a\))/g, '\n$1')
                             .replace(/(\(b\))/g, '\n$1')
                             .replace(/(\(c\))/g, '\n$1')
                             .replace(/(\(d\))/g, '\n$1')
                             .replace(/(\(e\))/g, '\n$1');
            console.log(formattedQuestion);
            quizContainer.innerHTML += `
                <div class="question">
                    <p><strong>Q${index + 1}:</strong> ${formattedQuestion.replace(/\n/g, '<br>')}</p>
                    <input type="text" id="answer-${index}" placeholder="Your answer here">
                </div>`;
        });
        submitQuizBtn.style.display = "block";
    } catch (error) {
        console.error("Error:", error);
        alert("There was an error generating the quiz.");
    }
});

// Submit answers and check them one by one
submitQuizBtn.addEventListener("click", async () => {
    let allAnswered = true;
    let score = 0;
    let resultsHtml = "";

    for (let i = 0; i < str_json.length; i++) {
        const userAnswer = document.getElementById(`answer-${i}`).value.trim();

        // Check if any answer is empty
        if (!userAnswer) {
            allAnswered = false;
        }
    }

    // If any question is unanswered, show an alert and stop submission
    if (!allAnswered) {
        alert("Please answer all questions before submitting.");
        return;
    }

    // Proceed with submission if all answers are filled
    for (let i = 0; i < str_json.length; i++) {
        const userAnswer = document.getElementById(`answer-${i}`).value;
        const format = document.getElementById("format").value;
        const level = document.getElementById("level").value;

        try {
            const checkResponse = await fetch("https://blastrevise-api.onrender.com/check-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: str_json[i],
                    user_answer: userAnswer,
                    questiontype: format,
                    questionlevel: level
                })
            });

            // Check if the response was successful
            if (!checkResponse.ok) {
                throw new Error(`HTTP error! Status: ${checkResponse.status}`);
            }

            const resultData = await checkResponse.json();
            console.log(resultData);
            

            if (resultData.error) {
                resultsHtml += `<p>Error checking answer for Q${i + 1}: ${resultData.error}</p>`;
                continue;
            }

            const isCorrect = resultData.result.slice(0, 20).toLowerCase().includes("correct");
            function formatExplanation(text) {
                text = text.replace(/(?!A)\*(?!\*)/g, '');

                return text.split(/\*{2,3}/)  // Splits on ** or ***
                           .map(part => part.trim() ? `<p class='smaller'>${part.trim()}</p>` : "")
                           .join("");
            }
            if (isCorrect) score++;
            resultsHtml += `
                <p>Q${i + 1}: ${isCorrect ? "✅ Correct" : "❌ Incorrect"}</p>
               ${resultData.result.length >= 25 ? `<div><p>Explanation:</p> ${formatExplanation(resultData.result)}</div>` : ""}
            `;

        } catch (error) {
            resultsHtml += `<p>Failed to check answer for Q${i + 1}.</p>`;
            console.error(error);
        }
    }

    resultDiv.innerHTML = resultsHtml + `<h3>Final Score: ${score} out of ${str_json.length}</h3>`;
});

document.getElementById("resetMemoryBtn").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to reset the question memory?")) return; // Confirmation

    try {
        const response = await fetch("https://blastrevise-api.onrender.com/reset-memory", { method: "POST" });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        alert(data.message);  // Show success message
    } catch (error) {
        console.error("Error resetting memory:", error);
        alert("Failed to reset memory.");
    }
});
document.getElementById("infoButton").addEventListener("click", () => {
    document.getElementById("infoPanel").style.right = "0";
});

document.getElementById("closePanel").addEventListener("click", () => {
    document.getElementById("infoPanel").style.right = "-400px";
});
