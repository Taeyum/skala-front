var winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function renderBoard(board) {
    return (
        board[0] + " | " + board[1] + " | " + board[2] + "\n" +
        "---------\n" +
        board[3] + " | " + board[4] + " | " + board[5] + "\n" +
        "---------\n" +
        board[6] + " | " + board[7] + " | " + board[8]
    );
}

function checkWinner(board) {
    for (var i = 0; i < winPatterns.length; i++) {
        var p = winPatterns[i];
        if (board[p[0]] === board[p[1]] && board[p[1]] === board[p[2]]) {
            return board[p[0]];
        }
    }
    return null;
}

function isBoardFull(board) {
    for (var i = 0; i < board.length; i++) {
        if (board[i] !== "X" && board[i] !== "O") {
            return false;
        }
    }
    return true;
}

function getEmptyIndices(board) {
    var empties = [];

    for (var i = 0; i < board.length; i++) {
        if (board[i] !== "X" && board[i] !== "O") {
            empties.push(i);
        }
    }

    return empties;
}

/* board의 빈 칸마다 player를 임시로 놓아보고, 그때 승리가 되는 칸이 있으면 그 칸의 index를 돌려줌 */
function findWinningMove(board, player) {
    var empties = getEmptyIndices(board);

    for (var i = 0; i < empties.length; i++) {
        var index = empties[i];
        var testBoard = board.slice();
        testBoard[index] = player;

        if (checkWinner(testBoard) === player) {
            return index;
        }
    }

    return -1;
}

/*
    컴퓨터(O)의 수를 정하는 간단한 우선순위 전략:
    1) 내가(O) 이번 수로 이길 수 있으면 그 칸
    2) 아니면 상대(X)가 다음에 이길 수 있는 칸을 미리 막기
    3) 아니면 중앙(5번) 칸
    4) 그것도 아니면 남은 칸 중 무작위
*/
function getComputerMove(board) {
    var winMove = findWinningMove(board, "O");
    if (winMove !== -1) {
        return winMove;
    }

    var blockMove = findWinningMove(board, "X");
    if (blockMove !== -1) {
        return blockMove;
    }

    if (board[4] !== "X" && board[4] !== "O") {
        return 4;
    }

    var empties = getEmptyIndices(board);
    var randomIndex = Math.floor(Math.random() * empties.length);
    return empties[randomIndex];
}

function getResultText(winner) {
    if (winner === "X") {
        return "🎉 당신이 승리했습니다!";
    }
    return "💻 컴퓨터가 승리했습니다!";
}

function playTicTacToe() {
    var board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    while (true) {
        var input = prompt(
            "⭕❌ 틱택토 (나: X, 컴퓨터: O)\n" +
            "──────────────\n" +
            renderBoard(board) + "\n\n" +
            "놓을 칸 번호(1~9)를 입력하세요."
        );

        if (input === null) {
            return;
        }

        var position = Number(input);

        if (isNaN(position) || position < 1 || position > 9) {
            alert("1~9 사이의 숫자를 입력해주세요.");
            continue;
        }

        var index = position - 1;

        if (board[index] === "X" || board[index] === "O") {
            alert("이미 놓인 칸이에요. 다른 칸을 선택해주세요.");
            continue;
        }

        board[index] = "X";

        var winner = checkWinner(board);
        if (winner) {
            alert(getResultText(winner) + "\n\n" + renderBoard(board));
            return;
        }

        if (isBoardFull(board)) {
            alert("🤝 무승부입니다!\n\n" + renderBoard(board));
            return;
        }

        var computerIndex = getComputerMove(board);
        board[computerIndex] = "O";

        winner = checkWinner(board);
        if (winner) {
            alert(
                "💻 컴퓨터가 " + (computerIndex + 1) + "번 칸에 놓았어요.\n\n" +
                getResultText(winner) + "\n\n" + renderBoard(board)
            );
            return;
        }

        if (isBoardFull(board)) {
            alert(
                "💻 컴퓨터가 " + (computerIndex + 1) + "번 칸에 놓았어요.\n\n" +
                "🤝 무승부입니다!\n\n" + renderBoard(board)
            );
            return;
        }

        alert("💻 컴퓨터가 " + (computerIndex + 1) + "번 칸에 놓았어요.\n\n" + renderBoard(board));
    }
}
