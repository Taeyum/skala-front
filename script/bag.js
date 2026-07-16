var myBag = [
    { name: "지갑", count: 1 },
    { name: "볼펜", count: 3 },
    { name: "노트북", count: 1 },
    { name: "이어폰", count: 2 },
    { name: "물병", count: 1 }
];

function getBagText() {
    var bagContents = "";

    for (var i = 0; i < myBag.length; i++) {
        bagContents += myBag[i].name + " - " + myBag[i].count + "개\n";
    }

    if (bagContents === "") {
        bagContents = "(가방이 비어있어요)";
    }

    return bagContents;
}

function showMyBag() {
    alert("🎒 내 가방 속 물품\n──────────────\n" + getBagText());
}

function addBagItem() {
    var name = prompt("추가할 물품 이름을 입력하세요.\n\n🎒 현재 가방\n──────────────\n" + getBagText());

    if (name === null || name === "") {
        return;
    }

    var countInput = prompt(name + "의 개수를 입력하세요.");

    if (countInput === null) {
        return;
    }

    var count = Number(countInput);

    if (isNaN(count) || count <= 0) {
        alert("1 이상의 숫자를 입력해주세요.");
        return;
    }

    var found = false;

    for (var i = 0; i < myBag.length; i++) {
        if (myBag[i].name === name) {
            myBag[i].count += count;
            found = true;
            break;
        }
    }

    if (!found) {
        myBag.push({ name: name, count: count });
    }

    alert("✅ " + name + " " + count + "개를 추가했어요!\n\n🎒 내 가방 속 물품\n──────────────\n" + getBagText());
}

function removeBagItem() {
    var name = prompt("삭제할 물품 이름을 입력하세요.\n\n🎒 현재 가방\n──────────────\n" + getBagText());

    if (name === null || name === "") {
        return;
    }

    var index = -1;

    for (var i = 0; i < myBag.length; i++) {
        if (myBag[i].name === name) {
            index = i;
            break;
        }
    }

    if (index === -1) {
        alert("가방에 \"" + name + "\"이(가) 없어요.");
        return;
    }

    var countInput = prompt(name + "을(를) 몇 개 삭제할까요? (현재 " + myBag[index].count + "개)");

    if (countInput === null) {
        return;
    }

    var count = Number(countInput);

    if (isNaN(count) || count <= 0) {
        alert("1 이상의 숫자를 입력해주세요.");
        return;
    }

    myBag[index].count -= count;

    if (myBag[index].count <= 0) {
        myBag.splice(index, 1);
        alert("🗑️ " + name + "을(를) 전부 삭제했어요!\n\n🎒 내 가방 속 물품\n──────────────\n" + getBagText());
    } else {
        alert("🗑️ " + name + " " + count + "개를 삭제했어요! (남은 개수: " + myBag[index].count + "개)\n\n🎒 내 가방 속 물품\n──────────────\n" + getBagText());
    }
}

function manageBag() {
    while (true) {
        var choice = prompt(
            "🎒 가방 관리\n──────────────\n" +
            "1. 가방 보기\n" +
            "2. 물품 추가\n" +
            "3. 물품 삭제\n" +
            "4. 종료\n\n" +
            "원하는 번호를 입력하세요."
        );

        if (choice === null || choice === "4") {
            return;
        }

        if (choice === "1") {
            showMyBag();
        } else if (choice === "2") {
            addBagItem();
        } else if (choice === "3") {
            removeBagItem();
        } else {
            alert("1~4 중에서 선택해주세요.");
        }
    }
}
