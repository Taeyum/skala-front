function startUpDownGame() {
    var computerNum = Math.floor(Math.random() * 50) + 1;
    var tries = 0;
    var guess;
    var history = [];

    while (true) {
        var promptMessage = "1부터 50 사이의 숫자를 맞춰보세요!";

        if (history.length > 0) {
            promptMessage += "\n\n[시도 횟수: " + tries + "]\n[내가 입력한 값]\n" + history.join("\n");
        }

        guess = prompt(promptMessage);

        if (guess === null) {
            return;
        }

        guess = Number(guess);

        if (isNaN(guess)) {
            alert("숫자를 입력해주세요.");
            continue;
        }

        tries++;

        if (guess > computerNum) {
            history.push(guess + " → Down!");
            alert("Down!\n\n[내가 입력한 값]\n" + history.join("\n"));
        } else if (guess < computerNum) {
            history.push(guess + " → Up!");
            alert("Up!\n\n[내가 입력한 값]\n" + history.join("\n"));
        } else {
            history.push(guess + " → 정답!");
            alert("축하합니다! " + tries + "번 만에 맞추셨습니다.\n\n[내가 입력한 값]\n" + history.join("\n"));
            break;
        }
    }
}
