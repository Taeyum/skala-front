/*
    서버/DB가 없는 정적 사이트라 회원 목록과 로그인 세션을 전부 localStorage에 저장함.
    비밀번호도 평문으로 저장되므로 실제 서비스에는 쓸 수 없는 학습/데모용 인증임.
*/
var AUTH_USERS_KEY = "skala-users";
var AUTH_SESSION_KEY = "skala-current-user";

function getUsers() {
    var raw = localStorage.getItem(AUTH_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function findUserById(id) {
    var users = getUsers();

    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id) {
            return users[i];
        }
    }

    return null;
}

function registerUser(userData) {
    if (findUserById(userData.id)) {
        return false;
    }

    var users = getUsers();
    users.push(userData);
    saveUsers(users);

    return true;
}

/*
    마이페이지 정보 수정용. pw는 입력했을 때만(빈 값이 아닐 때만) 덮어써서
    "비밀번호 변경란을 비워두면 기존 비밀번호 유지" 동작이 되게 함.
    현재 로그인 세션의 이름도 같이 최신화해서 nav 인사말이 바로 반영되게 함.
*/
function updateUser(id, updatedFields) {
    var users = getUsers();

    for (var i = 0; i < users.length; i++) {
        if (users[i].id !== id) {
            continue;
        }

        for (var key in updatedFields) {
            if (key === "pw" && !updatedFields.pw) {
                continue;
            }
            users[i][key] = updatedFields[key];
        }

        saveUsers(users);

        var session = getCurrentUser();
        if (session && session.id === id) {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ id: id, name: users[i].name }));
        }

        return users[i];
    }

    return null;
}

function loginUser(id, pw) {
    var user = findUserById(id);

    if (!user || user.pw !== pw) {
        return false;
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ id: user.id, name: user.name }));
    return true;
}

function logoutUser() {
    localStorage.removeItem(AUTH_SESSION_KEY);
}

function getCurrentUser() {
    var raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

/*
    모든 페이지 nav 상단의 #auth-status/#nav-login-item을 로그인 상태에 맞게 갱신함.
    galaga.js의 canvas null 체크와 같은 이유로, 이 요소들이 없는 페이지(현재는 없음)에서도
    에러 없이 조용히 통과하도록 null 체크를 해둠.
*/
function renderAuthStatus() {
    var statusBox = document.getElementById("auth-status");
    var loginNavItem = document.getElementById("nav-login-item");
    var user = getCurrentUser();

    if (!statusBox) {
        return;
    }

    statusBox.innerHTML = "";

    if (user) {
        var greeting = document.createElement("a");
        greeting.href = "myPage.html";
        greeting.textContent = "👋 " + user.name + "님";

        var logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.className = "auth-logout-btn";
        logoutBtn.textContent = "로그아웃";
        logoutBtn.addEventListener("click", function () {
            logoutUser();
            renderAuthStatus();
        });

        statusBox.appendChild(greeting);
        statusBox.appendChild(logoutBtn);

        if (loginNavItem) {
            loginNavItem.style.display = "none";
        }
    } else if (loginNavItem) {
        loginNavItem.style.display = "";
    }
}

var signUpForm = document.getElementById("signUpForm");

if (signUpForm) {
    signUpForm.addEventListener("submit", function (event) {
        var id = document.getElementById("userId").value;
        var pw = document.getElementById("userPw").value;

        var emailLocal = document.getElementById("userEmail").value;
        var emailDomain = document.getElementById("emailDomain").value;
        var email = emailDomain === "direct" ? emailLocal : emailLocal + "@" + emailDomain;

        var genderInput = document.querySelector('input[name="gender"]:checked');
        var interestInputs = document.querySelectorAll('input[name="interest"]:checked');
        var interests = [];

        for (var i = 0; i < interestInputs.length; i++) {
            interests.push(interestInputs[i].value);
        }

        var userData = {
            id: id,
            pw: pw,
            name: document.getElementById("userName").value,
            email: email,
            birth: document.getElementById("userBirth").value,
            gender: genderInput ? genderInput.value : "",
            interests: interests,
            joinPath: document.getElementById("joinPath").value,
            joinPathEtc: document.getElementById("joinPathEtc").value,
            intro: document.getElementById("intro").value
        };

        if (!registerUser(userData)) {
            event.preventDefault();
            alert("이미 존재하는 아이디입니다. 다른 아이디를 입력해주세요.");
            return;
        }

        /* 가입과 동시에 자동 로그인시켜서 signUpResult.html로 넘어갔을 때부터 로그인 상태로 보이게 함 */
        loginUser(id, pw);
    });
}

var loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var id = document.getElementById("loginId").value;
        var pw = document.getElementById("loginPw").value;
        var errorBox = document.getElementById("login-error");

        if (loginUser(id, pw)) {
            location.href = "index.html";
        } else if (errorBox) {
            errorBox.hidden = false;
        }
    });
}

/* 마이페이지: 로그인 안 했으면 접근 자체가 의미 없으므로 바로 로그인 페이지로 돌려보냄 */
var myPageForm = document.getElementById("myPageForm");

if (myPageForm) {
    var myPageSession = getCurrentUser();

    if (!myPageSession) {
        location.href = "login.html";
    } else {
        var myPageUser = findUserById(myPageSession.id);

        if (myPageUser) {
            document.getElementById("myPageId").value = myPageUser.id;
            document.getElementById("myPageName").value = myPageUser.name || "";

            var emailParts = (myPageUser.email || "").split("@");
            var domainSelect = document.getElementById("myPageEmailDomain");
            var domainValue = emailParts.length > 1 ? emailParts[1] : "direct";
            var domainFound = false;

            document.getElementById("myPageEmail").value = emailParts[0] || "";

            for (var d = 0; d < domainSelect.options.length; d++) {
                if (domainSelect.options[d].value === domainValue) {
                    domainFound = true;
                    break;
                }
            }
            domainSelect.value = domainFound ? domainValue : "direct";

            document.getElementById("myPageBirth").value = myPageUser.birth || "";

            if (myPageUser.gender) {
                var genderRadio = document.querySelector('input[name="myPageGender"][value="' + myPageUser.gender + '"]');
                if (genderRadio) {
                    genderRadio.checked = true;
                }
            }

            var interestBoxes = document.querySelectorAll('input[name="myPageInterest"]');
            for (var b = 0; b < interestBoxes.length; b++) {
                interestBoxes[b].checked = myPageUser.interests ? myPageUser.interests.indexOf(interestBoxes[b].value) !== -1 : false;
            }

            document.getElementById("myPageJoinPath").value = myPageUser.joinPath || "";
            document.getElementById("myPageJoinPathEtc").value = myPageUser.joinPathEtc || "";
            document.getElementById("myPageIntro").value = myPageUser.intro || "";
        }
    }

    myPageForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var session = getCurrentUser();
        if (!session) {
            return;
        }

        var emailLocal = document.getElementById("myPageEmail").value;
        var emailDomain = document.getElementById("myPageEmailDomain").value;
        var email = emailDomain === "direct" ? emailLocal : emailLocal + "@" + emailDomain;

        var genderInput = document.querySelector('input[name="myPageGender"]:checked');
        var interestInputs = document.querySelectorAll('input[name="myPageInterest"]:checked');
        var interests = [];

        for (var i = 0; i < interestInputs.length; i++) {
            interests.push(interestInputs[i].value);
        }

        updateUser(session.id, {
            pw: document.getElementById("myPagePw").value,
            name: document.getElementById("myPageName").value,
            email: email,
            birth: document.getElementById("myPageBirth").value,
            gender: genderInput ? genderInput.value : "",
            interests: interests,
            joinPath: document.getElementById("myPageJoinPath").value,
            joinPathEtc: document.getElementById("myPageJoinPathEtc").value,
            intro: document.getElementById("myPageIntro").value
        });

        document.getElementById("myPagePw").value = "";
        renderAuthStatus();

        var successBox = document.getElementById("myPage-success");
        if (successBox) {
            successBox.hidden = false;
        }
    });
}

renderAuthStatus();
