function calculateGrade() {
    var subjects = ["HTML", "CSS", "JavaScript"];
    var scores = [];

    while (scores.length < subjects.length) {
        var i = scores.length;
        var promptMessage =
            "📊 성적 계산기 (" + (i + 1) + " / " + subjects.length + ")\n" +
            "──────────────────\n" +
            subjects[i] + " 점수를 입력하세요. (0~100점)\n\n" +
            "✅ 합격 기준: 3과목 평균 60점 이상\n" +
            "↩️ 방금 입력한 점수를 고치려면 \"뒤로\"를 입력하세요.";

        if (scores.length > 0) {
            var historyLines = [];
            for (var j = 0; j < scores.length; j++) {
                historyLines.push(subjects[j] + ": " + scores[j] + "점");
            }
            promptMessage += "\n\n[지금까지 입력한 점수]\n" + historyLines.join("\n");
        }

        var input = prompt(promptMessage);

        if (input === null) {
            return;
        }

        if (input === "뒤로") {
            if (scores.length > 0) {
                scores.pop();
            } else {
                alert("첫 과목이라 더 이전으로 돌아갈 수 없어요.");
            }
            continue;
        }

        var score = Number(input);

        if (isNaN(score)) {
            alert("숫자를 입력해주세요.");
            continue;
        }

        if (score < 0 || score > 100) {
            alert("0~100 사이의 점수만 입력할 수 있어요.");
            continue;
        }

        scores.push(score);
    }

    var total = 0;
    for (var k = 0; k < scores.length; k++) {
        total += scores[k];
    }

    var average = Math.round(total / subjects.length);
    var result = average >= 60 ? "합격" : "불합격";

    var finalHistory = [];
    for (var m = 0; m < subjects.length; m++) {
        finalHistory.push(subjects[m] + ": " + scores[m] + "점");
    }

    alert(
        "총점: " + total + "점, 평균: " + average + ", 결과: " + result + "입니다!\n\n" +
        "[과목별 점수]\n" + finalHistory.join("\n")
    );
}
