/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
(() => {
  let allPages = [];
  let allProblems = [];
  $.getJSON("data/allpages.json?20210424", (json) => {
    allPages = json;
  });
  $.getJSON("data/allproblems.json?20210424", (json) => {
    allProblems = json;
  });
  let categoryPages = [];
  let theoremPages = [];
  let testsList =
    ``;
  let batchOptions = `<input class="input-field"
      
    </div>`;
  let problemOptions =
    `
  <div class="input-container input-flex-full">
    
    
  </div>`;
  let replaceButton = `<button class="text-button replace-problem">
    (Replace problem)
  </button>`;
  let notes = `<div class="notes">
    <h3 id="notes-header">Notes</h3>
    <ul id="notes-text">
      <li>
        You will receive randomized questions when you select view problem. 
      </li>
    <ul>
  </div>`;
  let printLinks = true;
  let clickedTimes = 0;
  let subtitleClicked = 0;
  let settingsClicked = "";
  let answerClicked = 0;
  let answerTries = 0;
  let progressUpdated = false;

  let searchParams = new URLSearchParams(location.search);
  let lastParam = searchParams.get("page") ?? searchParams.get("problems");

  // Toggles settings
  (() => {
    if (JSON.parse(localStorage.getItem("darkTheme"))) {
      $("#dark-toggle").text("Dark theme");
    }
    if (JSON.parse(localStorage.getItem("darkTheme")) == false) {
      $("#dark-toggle").text("Light theme");
    }
    if (JSON.parse(localStorage.getItem("serifFont"))) {
      $("#serif-toggle").text("Serif font");
    }
    if (JSON.parse(localStorage.getItem("justifyText"))) {
      $("#justify-toggle").text("Justified text");
    }
    if (JSON.parse(localStorage.getItem("mathJaxDisabled"))) {
      $("#katex-toggle").text("KaTeX off");
    }
    if (JSON.parse(localStorage.getItem("tabLinksExternal"))) {
      $("#links-toggle").text("New tab links: AoPS");
    }

    $("#dark-toggle").click(() => {
      settingsClicked = "1";
      document.body.removeAttribute("style");
      document.querySelector(".page-container").removeAttribute("style");
      if (JSON.parse(localStorage.getItem("darkTheme"))) {
        if (!window.matchMedia("(prefers-color-scheme: dark)").matches)
          $("#dark-stylesheet-link").remove();

        localStorage.removeItem("darkTheme");
        $("meta[name='color-scheme']").attr("content", "light dark");
        $("#dark-toggle").text("System theme");
      } else if (JSON.parse(localStorage.getItem("darkTheme")) === null) {
        $("#dark-stylesheet-link").remove();

        localStorage.setItem("darkTheme", false);
        $("meta[name='color-scheme']").attr("content", "light");
        $("#dark-toggle").text("Light theme");
      } else {
        $("#stylesheet-link").after(
          `<link id="dark-stylesheet-link" href="src/dark.css" rel="stylesheet" />`
        );

        localStorage.setItem("darkTheme", true);
        $("meta[name='color-scheme']").attr("content", "dark");
        $("#dark-toggle").text("Dark theme");
      }
    });

    $("#serif-toggle").click(() => {
      settingsClicked += "2";
      $(".article-text").toggleClass("serif-text");
      if (!JSON.parse(localStorage.getItem("serifFont"))) {
        localStorage.setItem("serifFont", true);
        $("#serif-toggle").text("Serif font");
      } else {
        localStorage.setItem("serifFont", false);
        $("#serif-toggle").text("Sans font");
      }
    });

    $("#justify-toggle").click(() => {
      settingsClicked += "3";
      $(".article-text").toggleClass("justify-text");
      if (!JSON.parse(localStorage.getItem("justifyText"))) {
        localStorage.setItem("justifyText", true);
        $("#justify-toggle").text("Justified text");
      } else {
        localStorage.setItem("justifyText", false);
        $("#justify-toggle").text("Unjustified text");
      }
    });

    $("#katex-toggle").click(() => {
      settingsClicked += "4";
      $(".article-text").toggleClass("katex-text");
      if (!JSON.parse(localStorage.getItem("mathJaxDisabled"))) {
        localStorage.setItem("mathJaxDisabled", true);
        $("#katex-toggle").text("KaTeX off");
      } else {
        localStorage.setItem("mathJaxDisabled", false);
        $("#katex-toggle").text("KaTeX on");
      }
    });

    $("#links-toggle").click(() => {
      settingsClicked += "5";

      if (!JSON.parse(localStorage.getItem("tabLinksExternal"))) {
        localStorage.setItem("tabLinksExternal", true);
        $("#links-toggle").text("New tab links: AoPS");

        $("a:not(#aops-wiki-link):not(.aops-link)").each(function () {
          $(this).attr({
            href: $(this)
              .attr("href")
              ?.replace(
                "?page=",
                "https://artofproblemsolving.com/wiki/index.php/"
              ),
            title: "",
          });
        });
      } else {
        localStorage.setItem("tabLinksExternal", false);
        $("#links-toggle").text("New tab links: Trivial");

        $("a:not(#aops-wiki-link):not(.aops-link)").each(function () {
          $(this).attr({
            href: $(this)
              .attr("href")
              ?.replace(
                "https://artofproblemsolving.com/wiki/index.php/",
                "?page="
              ),
            title: "",
          });
        });
      }
    });

    $("#print-toggle").click(() => {
      settingsClicked += "6";
      if (settingsClicked === "123456" && $("#fun-toggle").length === 0)
        $("#print-toggle").after(`
          <button class="text-button footer-button" id="fun-toggle" tabindex="0">
            Made you click
          </button>`);

      $(".page-container").toggleClass("nolinks-text");
      if (printLinks) {
        printLinks = false;
        $("#print-toggle").text("Print w/o links");
      } else {
        printLinks = true;
        $("#print-toggle").text("Print w/ links");
      }

      $("#fun-toggle").click(function () {
        $(".divider").remove();
        $(this).remove();
      });
    });
  })();

  // Adds things
  async function addProblem(pagename, pushUrl) {
    $(".notes").before(
      `<div class="problem-section" id="problem-section">
      <h2 class="section-header" id="article-header"></h2>
      <a href="" class="aops-link">
        (View on the AoPS Wiki)
      </a>
      <div class="article-text" id="problem-text"></div>
    </div>
    <div class="problem-section section-collapsed" id="solutions-section">
      <h2 class="section-header" id="solutions-header">Solutions</h2>
      <div class="article-text" id="solutions-text"></div>
    </div>`
    );
    let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
    let params = `action=parse&page=${pagename}&format=json`;

    let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
    let json = await response.json();
    let finalPage = pagename;

    if (json?.parse) {
      let problemText = latexer(json.parse.text["*"]);
      let problemProblem = getProblem(problemText);
      let problemSolutions = getSolutions(problemText);

      if (problemProblem && problemSolutions) {
      } else if (problemText.includes("Redirect to:")) {
        console.log("Redirect problem, going there instead...");

        let redirHref = $($.parseHTML(problemText))
          .find(".redirectText a")
          .attr("href");
        let redirPage = redirHref
          .replace("/wiki/index.php/", "")
          .replace(/_/g, " ");
        console.log(redirPage);

        params = `action=parse&page=${redirPage}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();
        problemText = latexer(json.parse.text["*"]);
        problemProblem = getProblem(problemText);
        problemSolutions = getSolutions(problemText);
        finalPage = redirPage;
      }

      addHistory(pagename, sourceCleanup(problemProblem).substring(0, 140));

      $("#problem-text").html(problemProblem);
      $("#solutions-text").html(problemSolutions);
      $("#article-header").html(titleCleanup(pagename));

      document.title = titleCleanup(pagename) + " - Linguist Grammar Reader";
      if (pushUrl) {
        history.pushState(
          { page: pagename },
          titleCleanup(pagename) + " - Linguist Grammar Reader",
          "?page=" + underscores(pagename)
        );
        searchParams = new URLSearchParams(location.search);
        lastParam = searchParams.get("page");
      }

      $(".aops-link").attr(
        "href",
        `https://artofproblemsolving.com/wiki/index.php/${underscores(
          finalPage
        )}`
      );
      katexFallback();
      customText();
      fixLinks();
      directLinks();
      collapseSolutions();

      if ($(".practice-progress").length === 0) {
        $("#problem-section").before(
        `<div class="practice-progress progress-nobottom progress-hidden">
          <div class="question-bar right-questions bar-hidden" style="flex-grow: 0">` +
          `<span id="right-num">0</span> correct</div>
          <div class="question-bar retry-questions bar-hidden" style="flex-grow: 0">` +
          `<span id="retry-num">0</span> retry</div>
          <div class="spacer-bar" style="flex-grow: 0"></div>
          <div class="question-bar blank-questions bar-hidden" style="flex-grow: 0">` +
          `<span id="blank-num">0</span> blank</div>
          <div class="question-bar wrong-questions bar-hidden" style="flex-grow: 0">` +
          `<span id="wrong-num">0</span> incorrect</div>
        </div>`
        );
      }

      $(".answer-check").remove();
      await addAnswer(pagename.replace(/_/g, " "));
      return getProblem(problemText) && getSolutions(problemText);
    } else {
      $(".article-text").before(
        `<p class="error">The page you specified does not exist.</p>`
      );
      $(".article-text").remove();
      $("#article-header").html("Error");
      $(".aops-link").remove();
      $("#solutions-section").remove();
    }
  }

  function addSearch() {
    $(".notes").before(
      `<div class="results-container">
      <span class="results-notice"></span>
    </div>`
    );
  }

  function addHistoryContainer() {
    $(".notes").before(
      `<div class="results-container">
      <button class="text-button" id="clear-history">(Clear history)</button>
    </div>`
    );
  }

  function addBatch() {
    $(".notes").before(
      `<div class="problem-section">
      <h2 class="section-header" id="batch-header">Problem Batch</h2>
      <div class="article-text" id="batch-text"></div>
    </div>
    <div class="problem-section section-collapsed" id="solutions-section">
      <h2 class="section-header" id="solutions-header">Solutions</h2>
      <div class="article-text batch-solutions-text" id="solutions-text"></div>
    </div>`
    );
  }

  function addUrlBatch() {
    $(".notes").before(
      `<div class="options-input" id="problems-input">
        ${batchOptions}
        <input class="input-field" id="input-problems"
        type="text" placeholder="Problems, e.g. 2018 AMC 12B #24"
        data-whitelist="${sortProblems(allProblems)
          .map((e) => titleCleanup(e))
          .toString()}">
      </div>
      <div class="problem-section">
        <h2 class="section-header" id="batch-header">Problem Batch</h2>
        <div class="article-text" id="batch-text"></div>
      </div>
      <div class="problem-section section-collapsed" id="solutions-section">
        <h2 class="section-header" id="solutions-header">Solutions</h2>
        <div class="article-text batch-solutions-text" id="solutions-text"></div>
      </div>`
    );
  }

  async function addArticle(pagename, pushUrl) {
    $(".error").remove();
    $(".problem-section").remove();
    $(".notes").before(`<div class="problem-section">
      <h2 class="section-header" id="article-header"></h2>
      <a href="" class="aops-link">
        (View on the AoPS Wiki)
      </a>
      <div class="article-text" id="full-text"></div>
    </div>`);

    let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
    let params = `action=parse&page=${pagename}&format=json`;

    let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
    let json = await response.json();

    if (json?.parse) {
      let problemText = latexer(json.parse.text["*"]);

      if (problemText.includes("Redirect to:")) {
        console.log("Redirect page, going there instead...");

        let redirHref = $($.parseHTML(problemText))
          .find(".redirectText a")
          .attr("href");
        let redirPage = redirHref
          .replace("/wiki/index.php/", "")
          .replace(/_/g, " ");
        console.log(redirPage);
        pagename = redirPage;

        params = `action=parse&page=${redirPage}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();
        problemText = latexer(json.parse.text["*"]);
      }

      problemText = $($.parseHTML(problemText))
        .children()
        .not(".toc")
        .not("table:contains('Printable version')")
        .not("pre:contains('<geogebra>')")
        .map(function () {
          return this.outerHTML;
        })
        .get()
        .join("");

      addHistory(pagename, sourceCleanup(problemText).substring(0, 140));

      $(".article-text").html(problemText);
      $("#article-header").html(titleCleanup(pagename));

      document.title = titleCleanup(pagename) + " - Linguist Grammar Reader";
      if (pushUrl) {
        history.pushState(
          { page: pagename },
          titleCleanup(pagename) + " - Linguist Grammar Reader",
          "?page=" + underscores(pagename)
        );
        searchParams = new URLSearchParams(location.search);
        lastParam = searchParams.get("page");
      }

      $(".aops-link").attr(
        "href",
        `https://artofproblemsolving.com/wiki/index.php/${underscores(
          pagename
        )}`
      );
      katexFallback();
    } else {
      $(".article-text").before(
        `<p class="error">The page you specified does not exist.</p>`
      );
      $(".article-text").remove();
      $("#article-header").html("Error");
      $(".aops-link").remove();
    }
    customText();
    fixLinks();
    directLinks();
  }

  async function fillBatch(pagenames, pushUrl) {
    async function makeBatch() {
      let problems = [];
      let problemTitles = pagenames
        .split("|")
        .map((e) => e.replace(/_/g, " ").replace("#", "Problems/Problem "));
      let numProblems = problemTitles.length;
      let invalidProblems = 0;

      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
      let params;
      let response;
      let json;

      $("#batch-header").after(
        `<div class="loading-notice">
          <div class="loading-text">Loading problems…</div>
          <div class="loading-bar-container">
            <div class="loading-bar"></div>
          </div>
        </div>`
      );

      for (let currentProblem of problemTitles) {
        console.log(currentProblem);

        params = `action=parse&page=${currentProblem}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();

        let problemText = latexer(json.parse.text["*"]);
        let problemProblem = getProblem(problemText);
        let problemSolutions = getSolutions(problemText);

        if (problemProblem && problemSolutions) {
          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${((problems.length + invalidProblems) / numProblems) * 100}%`
          );
        } else if (problemText.includes("Redirect to:")) {
          console.log("Redirect problem, going there instead...");

          let redirHref = $($.parseHTML(problemText))
            .find(".redirectText a")
            .attr("href");
          let redirPage = redirHref
            .replace("/wiki/index.php/", "")
            .replace(/_/g, " ");
          console.log(redirPage);

          params = `action=parse&page=${redirPage}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          problemText = latexer(json.parse.text["*"]);
          problemProblem = getProblem(problemText);
          problemSolutions = getSolutions(problemText);

          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${((problems.length + invalidProblems) / numProblems) * 100}%`
          );
        } else {
          console.log("Invalid problem, skipping...");
          problemTitles.splice(pageIndex, 1);
          invalidProblems++;
        }
      }

      console.log(problems);

      addProblems(problems, false);
    }
    await makeBatch();

    if (pushUrl) {
      history.pushState(
        { problems: pagenames },
        "Problem Batch - Linguist Grammar Reader",
        "?problems=" + pagenames
      );
      searchParams = new URLSearchParams(location.search);
      lastParam = searchParams.get("problems");
    }

    $(".loading-notice").remove();
    katexFallback();
    customText();
    changeName();
    fixLinks();
    collapseSolutions();
    directLinks();
    hideLinks();
    breakSets();
  }

  async function addAnswer(pagename) {
    answerClicked++;
    let answerClickedThen = answerClicked;
    answerTries = 0;
    progressUpdated = false;
    let answersTitle = `${pagename?.split(" Problems/Problem")[0]} Answer Key`;
    let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
    let params = `action=parse&page=${answersTitle}&format=json`;

    let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
    let json = await response.json();
    let answerText = json.parse?.text["*"];
    let problemNum = computeNumber(pagename);
    let answer = $($.parseHTML(answerText))
      ?.find("ol li")
      ?.eq(problemNum - 1)
      ?.text();
    if (answer) {
      if (answerClicked === answerClickedThen) {
        $("#problem-text").after(`<div class="answer-check">
        <div class="options-input answer-options">
          <input class="input-field" id="input-answer"
            type="text" placeholder="Enter answer (optional)"/>
          <button class="input-button" id="answer-button">
            Check Answer
          </button>
        </div>
        <div class="answer-feedback"></div>
      </div>`);

        $("#answer-button").click(async function () {
          let originalAnswer = sanitize($("#input-answer").val());
          originalAnswer = originalAnswer.toUpperCase();
          let finalAnswer = originalAnswer;
          if (finalAnswer) {
            if (computeTest(pagename) === "AIME")
              finalAnswer = originalAnswer.padStart(3, "0");
            answerTries++;
            if (finalAnswer === answer) {
              $(".answer-feedback")
                .prepend(`<div class="feedback-item correct-feedback">
              ${originalAnswer} is correct! :)
            </div>`);
              if (!progressUpdated) {
                $(".progress-hidden").removeClass("progress-hidden");
                progressUpdated = true;
                if (answerTries == 1) {
                  $(".question-bar.right-questions").removeClass("bar-hidden");
                  $(".question-bar.right-questions").css(
                    "flex-grow",
                    parseInt(
                      $(".question-bar.right-questions").css("flex-grow")
                    ) + 1
                  );
                  $("#right-num").text(
                    parseInt(
                      $(".question-bar.right-questions").css("flex-grow")
                    )
                  );
                } else {
                  $(".question-bar.retry-questions").removeClass("bar-hidden");
                  $(".question-bar.retry-questions").css(
                    "flex-grow",
                    parseInt(
                      $(".question-bar.retry-questions").css("flex-grow")
                    ) + 1
                  );
                  $("#retry-num").text(
                    parseInt(
                      $(".question-bar.retry-questions").css("flex-grow")
                    )
                  );
                }
                $("#solutions-header").click();
              }
            } else {
              $(".answer-feedback")
                .prepend(`<div class="feedback-item wrong-feedback">
              ${originalAnswer} is wrong :(
              </div>`);
            }
          }
          $("#input-answer").val("");
        });
      }
    }
  }

  // Gets and checks pages
  async function getPages() {
    function addPagesFromArray(members) {
      for (let problem of members) {
        if (
          matchesOptions(problem, tests, yearsFrom, yearsTo, diffFrom, diffTo)
        )
          pages.push(problem);
      }
    }

    function addPagesFromJSON(members) {
      for (let problem of members) {
        if (validProblem(problem.title)) {
          if (
            matchesOptions(
              problem.title,
              tests,
              yearsFrom,
              yearsTo,
              diffFrom,
              diffTo
            )
          )
            pages.push(problem.title);
          fullPages.push(problem.title);
        }
      }
    }

    let inputSubjects = $("#input-subjects");
    let inputTests = $("#input-tests");
    let inputYears = $("#input-years");
    let inputDiff = $("#input-diff");

    let subjects = inputSubjects.val().split(",");
    let tests = inputTests.val().split(",");
    let yearsFrom = inputYears.data().from;
    let yearsTo = inputYears.data().to;
    let diffFrom = inputDiff.data().from;
    let diffTo = inputDiff.data().to;

    let pages = [];
    let fullPages = [];

    if (!subjects[0]) {
      subjects[0] = "(All Subjects)";
    }
    if (!tests[0]) {
      tests[0] = "(All Tests)";
    }

    if (subjects.includes("(All Subjects)")) {
      for (let problem of allProblems) {
        if (
          matchesOptions(problem, tests, yearsFrom, yearsTo, diffFrom, diffTo)
        )
          pages.push(problem);
      }
    } else {
      for (let subject of subjects) {
        if (categoryPages.some((e) => e.subject === subject)) {
          addPagesFromArray(
            categoryPages.find((e) => e.subject === subject).pages
          );
        } else {
          console.log(`Loading category ${subject}...`);
          let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
          let pagename = subject;
          let params =
            `action=query&list=categorymembers` +
            `&cmtitle=Category:${pagename}&cmlimit=max&format=json`;
          let paramsContinue;

          let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          let json = await response.json();

          if (json.query.categorymembers?.[0]) {
            addPagesFromJSON(json.query.categorymembers);
            while (json?.continue) {
              paramsContinue =
                params + `&cmcontinue=${json.continue.cmcontinue}`;
              response = await fetch(
                `${apiEndpoint}?${paramsContinue}&origin=*`
              );
              json = await response.json();
              addPagesFromJSON(json.query.categorymembers);
            }
          }
          categoryPages.push({ subject: subject, pages: fullPages });
        }
      }
    }
    return pages;
  }

  function matchesOptions(
    problem,
    tests,
    yearsFrom,
    yearsTo,
    diffFrom,
    diffTo
  ) {
    if (!/^\d{4}.*Problems\/Problem \d+$/.test(problem)) return false;

    let problemTest = computeTest(problem);

    if (tests.includes("(AMC Tests)")) {
      tests.splice(
        tests.indexOf("(AMC Tests)"),
        1,
        "AHSME",
        "AMC 8",
        "AMC 10",
        "AMC 12",
        "AIME",
        "USAMO",
        "IMO"
      );
    }
    if (!tests.includes("(All Tests)") && !tests.includes(problemTest))
      return false;

    let problemYear = computeYear(problem);
    if (problemYear < yearsFrom || yearsTo < problemYear) return false;

    let problemNumber = computeNumber(problem);
    let problemDiff = computeDifficulty(
      problemTest,
      problemNumber,
      problemYear
    );
    if (problemDiff < diffFrom || diffTo < problemDiff) return false;

    return true;
  }

  const validProblem = (problem) =>
    problem.includes("Problems/Problem") &&
    problem.match(/^\d{4}/) &&
    problem.match(/\d+$/);

  const computeTest = (problem) =>
    problem
      .match(/(\d{4} )(.*)( Problems)/)[2]
      .replace(/AMC ((?:10)|(?:12))[AB]/, "AMC $1")
      .replace(/AIME I+/, "AIME")
      .replace(/AJHSME/, "AMC 8");
  const computeYear = (problem) => problem.match(/^\d{4}/)[0];
  const computeNumber = (problem) => problem.match(/\d+$/)[0];

  function computeDifficulty(test, num, year) {
    let diff;
    switch (test) {
      case "AMC 8":
        diff =
          num < 4
            ? 0.25
            : num < 7
            ? 0.5
            : num < 10
            ? 0.75
            : num < 13
            ? 1
            : num < 17
            ? 1.25
            : num < 21
            ? 1.5
            : num < 24
            ? 1.75
            : 2;
        break;
      case "AMC 10":
        diff =
          num < 4
            ? 1
            : num < 7
            ? 1.5
            : num < 10
            ? 1.75
            : num < 13
            ? 2
            : num < 15
            ? 2.25
            : num < 17
            ? 2.5
            : num < 19
            ? 2.75
            : num < 21
            ? 3
            : num < 23
            ? 3.5
            : num < 25
            ? 4
            : 4.5;
        break;
      case "AMC 12":
        diff =
          num < 4
            ? 1.25
            : num < 6
            ? 1.5
            : num < 9
            ? 1.75
            : num < 11
            ? 2
            : num < 14
            ? 2.5
            : num < 17
            ? 3
            : num < 19
            ? 3.25
            : num < 21
            ? 3.5
            : num < 23
            ? 4
            : num < 24
            ? 4.5
            : num < 25
            ? 5
            : 5.5;
        break;
      case "AHSME":
        diff =
          num < 4
            ? 1
            : num < 7
            ? 1.5
            : num < 10
            ? 1.75
            : num < 13
            ? 2
            : num < 15
            ? 2.25
            : num < 17
            ? 2.5
            : num < 19
            ? 2.75
            : num < 21
            ? 3
            : num < 23
            ? 3.5
            : num < 25
            ? 4
            : num < 27
            ? 4.5
            : num < 29
            ? 5
            : 5.5;
        break;
      case "AIME":
        diff =
          num < 3
            ? 3
            : num < 6
            ? 3.5
            : num < 8
            ? 4
            : num < 10
            ? 4.5
            : num < 11
            ? 5
            : num < 13
            ? 5.5
            : num < 14
            ? 6
            : 6.5;
        break;
      case "USAJMO":
        diff = num == 1 || num == 4 ? 5.5 : num == 2 || num == 5 ? 6 : 7;
        break;
      case "USAMO":
        diff = num == 1 || num == 4 ? 6.5 : num == 2 || num == 5 ? 7.5 : 8.5;
        break;
      case "IMO":
        diff = num == 1 || num == 4 ? 6.5 : num == 2 || num == 5 ? 7.5 : 9.5;
        break;
      case "Alabama ARML TST":
        diff = num < 4 ? 3 : num < 7 ? 3.5 : num < 10 ? 4 : num < 13 ? 4.5 : 5;
        break;
      case "APMO":
        diff =
          num == 1 ? 6 : num == 2 ? 6.5 : num == 3 ? 7 : num == 4 ? 7.5 : 8.5;
        break;
      case "BMO":
        diff = num == 1 ? 6 : num == 2 ? 6.5 : num == 3 ? 7.5 : 8;
        break;
      case "Canadian MO":
        diff =
          num == 1 ? 5.5 : num == 2 ? 6 : num == 3 ? 6.5 : num == 4 ? 7 : 7.5;
        break;
      case "Indonesia MO":
        diff =
          num == 1 || num == 5
            ? 3.5
            : num == 2 || num == 6
            ? 4.5
            : num == 3 || num == 7
            ? 5
            : 6;
        break;
      case "iTest":
        switch (year) {
          case "2006":
          case "2007":
            diff =
              num < 5
                ? 1
                : num < 9
                ? 1.5
                : num < 13
                ? 2
                : num < 17
                ? 2.5
                : num < 21
                ? 3
                : num < 25
                ? 3.5
                : num < 29
                ? 4
                : num < 33
                ? 4.5
                : num < 37
                ? 5
                : 5.5;
            break;
          case "2008":
            diff =
              num < 11
                ? 1
                : num < 21
                ? 1.5
                : num < 31
                ? 2
                : num < 41
                ? 2.5
                : num < 51
                ? 3
                : num < 61
                ? 3.5
                : num < 71
                ? 4
                : num < 81
                ? 4.5
                : num < 91
                ? 5
                : 5.5;
            break;
        }
        break;
      case "JBMO":
        diff = num == 1 ? 4 : num == 2 ? 4.5 : num == 3 ? 5 : 6;
        break;
      case "Putnam":
        diff =
          num == 1 ? 7 : num == 2 ? 7.5 : num == 3 ? 8 : num == 4 ? 8.5 : 9;
        break;
      case "UMO":
        diff =
          num == 1
            ? 3
            : num == 2
            ? 3.5
            : num == 3
            ? 4
            : num == 4
            ? 5
            : num == 5
            ? 6
            : 6.5;
        break;
      case "UNCO Math Contest II":
        diff =
          num < 2
            ? 1
            : num < 3
            ? 1.5
            : num < 4
            ? 2
            : num < 5
            ? 2.5
            : num < 6
            ? 3
            : num < 7
            ? 3.5
            : num < 8
            ? 4
            : num < 9
            ? 4.5
            : num < 10
            ? 5
            : 5.5;
        break;
      case "UNM-PNM Statewide High School Mathematics Contest II":
        diff =
          num < 3
            ? 2
            : num < 4
            ? 2.5
            : num < 5
            ? 3
            : num < 6
            ? 3.5
            : num < 8
            ? 4
            : num < 9
            ? 4.5
            : num < 10
            ? 5
            : 5.5;
        break;
      default:
        diff = -1;
        break;
    }
    return diff;
  }

  // Sorts
  const sortProblems = (problems) =>
    problems.sort(
      (a, b) =>
        Math.sign(computeYear(a) - computeYear(b)) ||
        computeTest(a).localeCompare(computeTest(b)) ||
        Math.sign(computeNumber(a) - computeNumber(b))
    );

  // Splits and adds problem parts
  function getProblem(htmlString) {
    let htmlParsed = $.parseHTML(htmlString);
    let after = $(htmlParsed)
      .children()
      .first()
      .nextUntil(":header:not(:contains('Problem'))")
      .addBack()
      .not(".toc")
      .not(":header:contains('Problem')");
    $(after).last("p").find("> br:first-child").remove();

    let afterHTML = $(after)
      .map(function () {
        return this.outerHTML;
      })
      .get()
      .join("");
    return afterHTML;
  }

  function getSolutions(htmlString) {
    let htmlParsed = $.parseHTML(htmlString);
    let after = $(htmlParsed)
      .children()
      .filter(":header:contains('Solution')")
      .nextUntil(":header:contains('See'), table")
      .addBack(":header:contains(' Solution'), :header:contains('Solution ')")
      .not("p:contains('The problems on this page are copyrighted by the')");

    let afterHTML = $(after)
      .map(function () {
        return this.outerHTML;
      })
      .get()
      .join("");
    return afterHTML;
  }

  function addProblems(problems, addReplace) {
    let problemList = problems.map((e) => titleCleanup(e.title)).join(", ");
    $("#batch-text").before(`<button class="text-button" id="copy-problems"
        data-clipboard-text="${problemList}">
        (Copy problem list)
      </button>`);
    new ClipboardJS("#copy-problems");

    for (let [index, problem] of problems.entries()) {
      $("#batch-text").append(`<div class="article-problem"
        index="${index + 1}" difficulty="${problem.difficulty}">
        <h2 class="problem-heading">Problem ${index + 1}
          <span class="source-link">
            (<a class="source-link-a"
              href="https://artofproblemsolving.com/wiki/index.php/${underscores(
                problem.title
              )}">${titleCleanup(problem.title)}</a>)
          </span>${addReplace ? replaceButton : ``}
        </h2>${problem.problem}
      </div>`);

      $("#solutions-text").append(`<div class="article-problem" 
        index="${index + 1}" difficulty="${problem.difficulty}">
        <h2 class="problem-heading">
          Problem ${index + 1}
          <span class="source-link">
            (<a class="source-link-a"
              href="https://artofproblemsolving.com/wiki/index.php/${underscores(
                problem.title
              )}">${titleCleanup(problem.title)}</a>)
          </span>
        </h2>${problem.problem}
        <div class="solutions-divider">Solution</div>
        ${problem.solutions}
      </div>`);
    }
  }

  // Formatting
  const sanitize = (string) =>
    string
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatLatex = (string) =>
    string
      .replace(/&#160;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/^\$|\$$|\\\[|\\\]/g, "")
      .replace(/&lt;/g, "\\lt ")
      .replace(/&gt;/g, "\\gt ")
      .replace(/\$/g, "\\$$")
      .replace(/align\*/g, "aligned")
      .replace(/eqnarray\*/g, "aligned")
      .replace(/{tabular}(\[\w\])*/g, "{array}")
      .replace(/\\bold/g, "\\mathbf")
      .replace(/\\congruent/g, "\\cong")
      .replace(/\\overarc/g, "\\overgroup")
      .replace(/\\overparen/g, "\\overgroup")
      .replace(/\\underarc/g, "\\undergroup")
      .replace(/\\underparen/g, "\\undergroup")
      .replace(/\\mathdollar/g, "\\$")
      .replace(/\\textdollar/g, "\\$");

  const titleCleanup = (string) =>
    decodeURIComponent(string)
      .replace(/_/g, " ")
      .replace("Problems/Problem ", "#")
      .replace(/'/g, "’");
  const underscores = (string) =>
    string.replace(/ /g, "_").replace(/%2F/g, "/");
  const capitalize = (string) => {
    if (typeof string !== "string") return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const latexer = (html) => {
    html = html.replace(/<pre>\s+?(.*?)<\/pre>/gs, "$1");

    let images = html.match(/<img (?:.*?) class="latex\w*?" (?:.*?)>/g);
    images = [...new Set(images)];

    if (images) {
      for (let image of images) {
        if (!image.includes("[asy]")) {
          let isDisplay = /alt="\\\[|\\begin/.test(image);
          let imageLatex = formatLatex(image.match(/alt="(.*?)"/)[1]);
          let renderedLatex = katex.renderToString(imageLatex, {
            throwOnError: false,
            displayMode: isDisplay,
          });
          html = html.replaceAll(
            image,
            `<span class="fallback-container">$&</span>` +
              `<katex class="katex-container">${renderedLatex}</katex>`
          );
        }
      }
    }
    return html;
  };

  const sourceCleanup = (string) =>
    string
      .replace(
        /<span class="fallback-container">.*?<\/span><katex class="katex-container">.*?<annotation encoding="application\/x-tex">(.*?)<\/annotation>.*?<\/katex>/gs,
        "$$$1$$"
      )
      .replace(
        /<span class="mw-headline" id="Problem">Problem<\/span><span class="mw-editsection"><span class="mw-editsection-bracket">\[<\/span><a href=".*?" title="Edit section: Problem">edit<\/a><span class="mw-editsection-bracket">\]<\/span><\/span><\/h2>/g,
        ""
      )
      .replace(/<span class="mw-headline" id=".*?">(.*?)<\/span>/g, "$1")
      .replace(/<span class="mw-editsection">.*?<\/span><\/span>/g, "")
      .replace(/<a.*?>/g, "")
      .replace(/<\/a>/g, "")
      .replace(/<br.*?>/g, "")
      .replace(/<dl>.*?<\/dl>/g, "")
      .replace(/<img.*?>/g, "")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "");

  // Nav elements
  $("#single-problem").click(() => {
    clearAll();
    activeButton("single-problem");

    $("#main-button-container").after(
      `<div class="button-container" id="secondary-button-container">
        <button type="button" class="button secondary-button"
          id="random-nav">
          Random
        </button>
        <button type="button" class="button secondary-button"
          id="single-nav">
          Select
        </button>
        <div class="secondary-spacer"></div>
      </div>`
    );
    $("#random-nav").click();
    $("#random-input").after($(".practice-progress"));
  });

  $("#problem-batch").click(() => {
    clearAll();
    activeButton("problem-batch");

    $("#main-button-container").after(
      `<div class="button-container" id="secondary-button-container">
        <button type="button" class="button secondary-button" id="ranbatch-nav">
          Random
        </button>
        <button type="button" class="button secondary-button" id="batch-nav">
          Past Test
        </button>
        <button type="button" class="button secondary-button 
        button-flex-full" id="problems-nav">
          Custom
        </button>
        <div class="secondary-spacer"></div>
      </div>`
    );
    $("#ranbatch-nav").click();
  });

  $(".page-container").on("click", "#single-nav", () => {
    clearOptions();
    activeSecondaryButton("single-nav");

    $("#secondary-button-container").after(
      `<div class="options-input" id="single-input">
        <button class="input-button" id="single-button">
          View Problem
        </button>
      </div>
      ${notes}`
    );
    renderChart();
    collapseNotes();
    directLinks();

    let inputSingleTest = document.querySelector("#input-singletest");
    new Tagify(inputSingleTest, {
      mode: "select",
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });
  });

  $(".page-container").on("click", "#random-nav", () => {
    clearOptions();
    activeSecondaryButton("random-nav");

    $("#secondary-button-container").after(
      `<div class="options-input" id="random-input">
        ${problemOptions}

      </div>
      ${notes}`
    );
    $("#random-input").after($(".practice-progress"));
    renderChart();
    collapseNotes();
    directLinks();

    let inputSubjects = document.querySelector("#input-subjects");
    new Tagify(inputSubjects, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });
    let inputTests = document.querySelector("#input-tests");
    new Tagify(inputTests, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });

    $("#input-years").ionRangeSlider({
      type: "double",
      grid: true,
      min: 1974,
      max: 2021,
      from: 1974,
      to: 2021,
      prettify_enabled: false,
    });
    $("#input-diff").ionRangeSlider({
      type: "double",
      grid: true,
      min: 0,
      max: 10,
      from: 0,
      to: 10,
      step: 0.5,
    });
  });

  $(".page-container").on("click", "#batch-nav", () => {
    clearOptions();
    activeSecondaryButton("batch-nav");

    $("#secondary-button-container").after(
      `<div class="options-input" id="batch-input">
        
      
        <button class="input-button" id="batch-button">
          View Test
        </button>
      </div>
      ${notes}`
    );
    renderChart();
    collapseNotes();
    directLinks();
    nameLive();
    breakLive();
    hideToggle();

    let inputSingleTest = document.querySelector("#input-singletest");
    new Tagify(inputSingleTest, {
      mode: "select",
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });
  });

  $(".page-container").on("click", "#problems-nav", () => {
    clearOptions();
    activeSecondaryButton("problems-nav");

    $("#secondary-button-container").after(
      `<div class="options-input" id="problems-input">
        ${batchOptions}
        <input class="input-field" id="input-problems"
        type="text" placeholder="Problems, e.g. 2018 AMC 12B #24"
        data-whitelist="${sortProblems(allProblems)
          .map((e) => titleCleanup(e))
          .toString()}">
      </div>
      ${notes}`
    );
    renderChart();
    collapseNotes();
    directLinks();
    nameLive();
    breakLive();
    hideToggle();

    let inputProblems = document.querySelector("#input-problems");
    new Tagify(inputProblems, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
      },
    });
  });

  $(".page-container").on("click", "#ranbatch-nav", () => {
    clearOptions();
    activeSecondaryButton("ranbatch-nav");

    $("#secondary-button-container").after(
      `<div class="options-input" id="ranbatch-input">

      </div>
      ${notes}`
    );
    renderChart();
    collapseNotes();
    directLinks();
    nameLive();
    breakLive();
    hideToggle();

    let inputSubjects = document.querySelector("#input-subjects");
    new Tagify(inputSubjects, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });
    let inputTests = document.querySelector("#input-tests");
    new Tagify(inputTests, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
        maxItems: 100,
      },
    });
    let inputProblems = document.querySelector("#input-problems");
    new Tagify(inputProblems, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
      },
    });
    let inputSkip = document.querySelector("#input-skip");
    new Tagify(inputSkip, {
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        enabled: 0,
      },
    });

    $("#input-years").ionRangeSlider({
      type: "double",
      grid: true,
      min: 1974,
      max: 2021,
      from: 1974,
      to: 2021,
      prettify_enabled: false,
    });
    $("#input-diff").ionRangeSlider({
      type: "double",
      grid: true,
      min: 0,
      max: 10,
      from: 0,
      to: 10,
      step: 0.5,
    });
    $("#input-number").ionRangeSlider({
      grid: true,
      min: 0,
      max: 40,
      from: 5,
    });
  });

  $(".page-container").on("click", "#search-nav", () => {
    clearAll();
    activeButton("search-nav");

    $("#main-button-container").after(
      `<div class="options-input" id="search-input">
        <div class="input-container checkbox-container
          checkbox-container-smaller input-flexer-full">
          <div class="checkbox-wrap">
            <input type="checkbox" class="input-check" id="input-problemsonly"/>
            <label class="checkbox-label">
              Only show problems?
            </label>
          </div>
        </div>
        <input class="input-field input-end" id="input-search"
          type="text" placeholder="Keywords, e.g. Cauchy">
        <button class="input-button input-button-half" id="search-button">
          Search Pages
        </button>
        <button class="input-button input-button-half" id="theorem-button">
          Random Theorem
        </button>
      </div>
      ${notes}`
    );
    renderChart();
    collapseNotes();
    directLinks();

    let inputSearch = document.querySelector("#input-search");
    new Tagify(inputSearch, {
      mode: "select",
      originalInputValueFormat: (values) => values.map((e) => e.value),
      dropdown: {
        maxItems: 7,
      },
      whitelist: allPages,
    });
  });

  // Buttons
  $(".page-container").on("click", "#single-button", async () => {
    clearProblem();

    await addProblem(
      sanitize(
        `${$("#input-singleyear").val()} ${$(
          "#input-singletest"
        ).val()} Problems/Problem ${$("#input-singlenum").val()}`
      ),
      true
    );
  });

  $(".page-container").on("click", "#random-button", async () => {
    clearProblem();

    let pages = await getPages();
    console.log(`${pages.length} total problems retrieved.`);

    if (pages.length === 0) {
      $(".notes").before(
        `<div class="problem-section">
          <h2 class="section-header" id="article-header">Error</h2>
          <p class="error">
            No problems could be found meeting those requirements.
          </p>
        </div>`
      );
    } else {
      let invalid = true;
      let response;
      while (invalid) {
        clearProblem();

        let randomPage = pages[Math.floor(Math.random() * pages.length)];
        console.log(randomPage);
        response = await addProblem(randomPage, true);
        invalid = !response;
      }
    }
  });

  $(".page-container").on("click", "#batch-button", async () => {
    async function makeBatch() {
      let problemTitles = sortProblems(allProblems).filter((e) =>
        e.includes(
          sanitize(
            `${$("#input-singleyear").val()} ${$(
              "#input-singletest"
            ).val()} Problems/Problem`
          )
        )
      );
      let numProblems = problemTitles.length;

      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
      let params;
      let response;
      let json;

      $("#batch-header").after(
        `<div class="loading-notice">
          <div class="loading-text">Loading problems…</div>
          <div class="loading-bar-container">
            <div class="loading-bar"></div>
          </div>
        </div>`
      );

      for (let currentProblem of problemTitles) {
        if (clickedTimes !== clickedTimesThen) break;
        console.log(currentProblem);

        params = `action=parse&page=${currentProblem}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();

        let problemText = latexer(json.parse.text["*"]);
        let problemProblem = getProblem(problemText);
        let problemSolutions = getSolutions(problemText);

        if (problemProblem && problemSolutions) {
          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${(problems.length / numProblems) * 100}%`
          );
        } else if (problemText.includes("Redirect to:")) {
          console.log("Redirect problem, going there instead...");

          let redirHref = $($.parseHTML(problemText))
            .find(".redirectText a")
            .attr("href");
          let redirPage = redirHref
            .replace("/wiki/index.php/", "")
            .replace(/_/g, " ");
          console.log(redirPage);

          params = `action=parse&page=${redirPage}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          problemText = latexer(json.parse.text["*"]);
          problemProblem = getProblem(problemText);
          problemSolutions = getSolutions(problemText);

          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${(problems.length / numProblems) * 100}%`
          );
        } else {
          console.log("Invalid problem, skipping...");
          problemTitles.splice(pageIndex, 1);
        }
      }

      if (clickedTimes === clickedTimesThen) {
        addHistoryBatch(
          problems.map((e) => e.title),
          sourceCleanup(problems[0].problem).substring(0, 140),
          sanitize(
            `${$("#input-singleyear").val()} ${$("#input-singletest").val()}`
          )
        );

        console.log(problems);
        addProblems(problems, false);
      }
    }

    clickedTimes++;
    let clickedTimesThen = clickedTimes;
    clearProblem();

    addBatch();

    let problems = [];
    let inputSingleTest = $("#input-singletest");
    if (!inputSingleTest.val()) {
      $(".article-text").before(
        `<p class="error">
          No test was entered.
        </p>`
      );
      $(".article-text").remove();
      $("#batch-header").html("Error");
      $("#solutions-section").remove();
    } else {
      await makeBatch();

      if (clickedTimes === clickedTimesThen) {
        $(".loading-notice").remove();
        katexFallback();
        customText();
        let name = $("#input-name").val()
          ? sanitize($("#input-name").val())
          : sanitize(
              `${$("#input-singleyear").val()} ${$(
                "#input-singletest"
              ).val()} Problems`
            );
        $("#batch-header").html(name);
        document.title = name + " - Linguist Grammar Reader";

        history.pushState(
          { problems: problems.map((e) => underscores(e.title)).join("|") },
          name + " - Linguist Grammar Reader",
          "?problems=" + problems.map((e) => underscores(e.title)).join("|")
        );
        searchParams = new URLSearchParams(location.search);
        lastParam = searchParams.get("problems");
        fixLinks();
        collapseSolutions();
        directLinks();
        hideLinks();
        breakSets();
      }
    }
  });

  $(".page-container").on("click", "#problems-button", async () => {
    async function makeBatch() {
      let problemTitles = inputProblems
        .val()
        .split(",")
        .map((e) => e.replace("#", "Problems/Problem "));
      let numProblems = problemTitles.length;
      let invalidProblems = 0;

      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
      let params;
      let response;
      let json;

      $("#batch-header").after(
        `<div class="loading-notice">
          <div class="loading-text">Loading problems…</div>
          <div class="loading-bar-container">
            <div class="loading-bar"></div>
          </div>
        </div>`
      );

      for (let currentProblem of problemTitles) {
        if (clickedTimes !== clickedTimesThen) break;
        console.log(currentProblem);

        params = `action=parse&page=${currentProblem}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();

        let problemText = latexer(json.parse.text["*"]);
        let problemProblem = getProblem(problemText);
        let problemSolutions = getSolutions(problemText);

        if (problemProblem && problemSolutions) {
          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${((problems.length + invalidProblems) / numProblems) * 100}%`
          );
        } else if (problemText.includes("Redirect to:")) {
          console.log("Redirect problem, going there instead...");

          let redirHref = $($.parseHTML(problemText))
            .find(".redirectText a")
            .attr("href");
          let redirPage = redirHref
            .replace("/wiki/index.php/", "")
            .replace(/_/g, " ");
          console.log(redirPage);

          params = `action=parse&page=${redirPage}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          problemText = latexer(json.parse.text["*"]);
          problemProblem = getProblem(problemText);
          problemSolutions = getSolutions(problemText);

          problems.push({
            title: currentProblem,
            difficulty: computeDifficulty(
              computeTest(currentProblem),
              computeNumber(currentProblem),
              computeYear(currentProblem)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          $(".loading-bar").css(
            "width",
            `${((problems.length + invalidProblems) / numProblems) * 100}%`
          );
        } else {
          console.log("Invalid problem, skipping...");
          problemTitles.splice(pageIndex, 1);
          invalidProblems++;
        }
      }

      if (clickedTimes === clickedTimesThen) {
        if ($("#input-sort").prop("checked"))
          problems.sort((a, b) => a.difficulty - b.difficulty);

        addHistoryBatch(
          problems.map((e) => e.title),
          sourceCleanup(problems[0].problem).substring(0, 140)
        );

        console.log(problems);
        addProblems(problems, false);
      }
    }

    clickedTimes++;
    let clickedTimesThen = clickedTimes;
    clearProblem();

    addBatch();

    let problems = [];
    let inputProblems = $("#input-problems");
    if (!inputProblems.val()) {
      $(".article-text").before(
        `<p class="error">
          No problems were entered.
        </p>`
      );
      $(".article-text").remove();
      $("#batch-header").html("Error");
      $("#solutions-section").remove();
    } else {
      await makeBatch();
    }

    let name = $("#input-name").val();
    history.pushState(
      { problems: problems.map((e) => underscores(e.title)).join("|") },
      name + " - Linguist Grammar Reader",
      "?problems=" + problems.map((e) => underscores(e.title)).join("|")
    );
    searchParams = new URLSearchParams(location.search);
    lastParam = searchParams.get("problems");

    if (clickedTimes === clickedTimesThen) {
      $(".loading-notice").remove();
      katexFallback();
      customText();
      changeName();
      fixLinks();
      collapseSolutions();
      directLinks();
      hideLinks();
      breakSets();
    }
  });

  $(".page-container").on("click", "#ranbatch-button", async () => {
    async function makeBatch() {
      let numProblems = Math.min(inputNumber.data().from, pages.length);
      let randomPage;
      let pageIndex;
      let problemTitles = inputProblems
        .val()
        .split(",")
        .map((e) => e.replace("#", "Problems/Problem "));
      let skipProblems = inputSkip
        .val()
        .split(",")
        .map((e) => e.replace("#", "Problems/Problem "));

      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
      let params;
      let response;
      let json;

      $("#batch-header").after(
        `<div class="loading-notice">
          <div class="loading-text">Loading problems…</div>
          <div class="loading-bar-container">
            <div class="loading-bar"></div>
          </div>
        </div>`
      );

      if (inputProblems.val())
        for (let currentProblem of problemTitles) {
          if (clickedTimes !== clickedTimesThen) break;
          console.log(currentProblem);

          params = `action=parse&page=${currentProblem}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          let problemText = latexer(json.parse.text["*"]);
          let problemProblem = getProblem(problemText);
          let problemSolutions = getSolutions(problemText);

          if (problemProblem && problemSolutions) {
            problems.push({
              title: currentProblem,
              difficulty: computeDifficulty(
                computeTest(currentProblem),
                computeNumber(currentProblem),
                computeYear(currentProblem)
              ),
              problem: problemProblem,
              solutions: problemSolutions,
            });

            $(".loading-bar").css(
              "width",
              `${(problems.length / numProblems) * 100}%`
            );
          } else if (problemText.includes("Redirect to:")) {
            console.log("Redirect problem, going there instead...");

            let redirHref = $($.parseHTML(problemText))
              .find(".redirectText a")
              .attr("href");
            let redirPage = redirHref
              .replace("/wiki/index.php/", "")
              .replace(/_/g, " ");
            console.log(redirPage);

            params = `action=parse&page=${redirPage}&format=json`;
            response = await fetch(`${apiEndpoint}?${params}&origin=*`);
            json = await response.json();

            problemText = latexer(json.parse.text["*"]);
            problemProblem = getProblem(problemText);
            problemSolutions = getSolutions(problemText);

            problems.push({
              title: currentProblem,
              difficulty: computeDifficulty(
                computeTest(currentProblem),
                computeNumber(currentProblem),
                computeYear(currentProblem)
              ),
              problem: problemProblem,
              solutions: problemSolutions,
            });

            $(".loading-bar").css(
              "width",
              `${(problems.length / numProblems) * 100}%`
            );
          } else {
            console.log("Invalid problem, skipping...");
            pages.splice(pageIndex, 1);
          }
        }

      while (
        problems.length < numProblems &&
        pages.length !== 0 &&
        clickedTimes === clickedTimesThen
      ) {
        let blockedProblem = true;

        while (blockedProblem) {
          pageIndex = Math.floor(Math.random() * pages.length);
          randomPage = pages[pageIndex];
          console.log(randomPage);

          blockedProblem = skipProblems.includes(randomPage);
          if (blockedProblem) pages.splice(pageIndex, 1);
        }

        params = `action=parse&page=${randomPage}&format=json`;
        response = await fetch(`${apiEndpoint}?${params}&origin=*`);
        json = await response.json();

        let problemText = latexer(json.parse.text["*"]);
        let problemProblem = getProblem(problemText);
        let problemSolutions = getSolutions(problemText);

        if (problemProblem && problemSolutions) {
          problems.push({
            title: randomPage,
            difficulty: computeDifficulty(
              computeTest(randomPage),
              computeNumber(randomPage),
              computeYear(randomPage)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          pages.splice(pageIndex, 1);
          $(".loading-bar").css(
            "width",
            `${(problems.length / numProblems) * 100}%`
          );
        } else if (problemText.includes("Redirect to:")) {
          console.log("Redirect problem, going there instead...");

          let redirHref = $($.parseHTML(problemText))
            .find(".redirectText a")
            .attr("href");
          let redirPage = redirHref
            .replace("/wiki/index.php/", "")
            .replace(/_/g, " ");
          console.log(redirPage);

          params = `action=parse&page=${redirPage}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          problemText = latexer(json.parse.text["*"]);
          problemProblem = getProblem(problemText);
          problemSolutions = getSolutions(problemText);

          problems.push({
            title: randomPage,
            difficulty: computeDifficulty(
              computeTest(randomPage),
              computeNumber(randomPage),
              computeYear(randomPage)
            ),
            problem: problemProblem,
            solutions: problemSolutions,
          });

          pages.splice(pageIndex, 1);
          $(".loading-bar").css(
            "width",
            `${(problems.length / numProblems) * 100}%`
          );
        } else {
          console.log("Invalid problem, skipping...");
          pages.splice(pageIndex, 1);
        }
      }

      if (clickedTimes === clickedTimesThen) {
        if ($("#input-sort").prop("checked"))
          problems.sort((a, b) => a.difficulty - b.difficulty);

        addHistoryBatch(
          problems.map((e) => e.title),
          sourceCleanup(problems[0].problem).substring(0, 140)
        );

        console.log(problems);
        addProblems(problems, true);
      }
    }

    clickedTimes++;
    let clickedTimesThen = clickedTimes;
    clearProblem();

    addBatch();

    let inputNumber = $("#input-number");
    let inputProblems = $("#input-problems");
    let inputSkip = $("#input-skip");

    let pages = await getPages();
    let problems = [];
    console.log(`${pages.length} total problems retrieved.`);
    if (pages.length === 0) {
      $(".article-text").before(
        `<p class="error">
          No problems could be found meeting those requirements.
        </p>`
      );
      $(".article-text").remove();
      $("#batch-header").html("Error");
      $("#solutions-section").remove();
    } else {
      await makeBatch();
    }

    let name = $("#input-name").val();
    history.pushState(
      { problems: problems.map((e) => underscores(e.title)).join("|") },
      name + " - Linguist Grammar Reader",
      "?problems=" + problems.map((e) => underscores(e.title)).join("|")
    );
    searchParams = new URLSearchParams(location.search);
    lastParam = searchParams.get("problems");

    if (clickedTimes === clickedTimesThen) {
      $(".loading-notice").remove();
      katexFallback();
      replaceProblems(problems);
      customText();
      changeName();
      fixLinks();
      collapseSolutions();
      directLinks();
      hideLinks();
      breakSets();
    }
  });

  $(".page-container").on("click", "#search-button", async () => {
    async function addResults(
      originalSearch,
      search,
      searchResults,
      pageExists
    ) {
      let resultsNum = searchResults.length;
      let loadedTimes = 0;

      $(".results-notice").html(`${resultsNum} results found`);
      if (pageExists)
        $(".results-notice").append(
          ` | <a href="https://artofproblemsolving.com/wiki/index.php/${encodeURIComponent(
            underscores(search)
          )}">${capitalize(
            titleCleanup(encodeURIComponent(originalSearch))
          )}</a> exists on the wiki`
        );

      for (let i = 0; i < resultsNum && i < 10; i++) addResult();
      loadedTimes++;
      if (searchResults.length)
        $(".results-container").after(
          `<button class="text-button" id="load-results">Load more…</button>`
        );

      $("#load-results").click(() => {
        for (let i = 0; i < resultsNum - loadedTimes * 10 && i < 10; i++)
          addResult();
        loadedTimes++;
        if (!searchResults.length) $("#load-results").remove();
        fixLinks();
        directLinks();
      });
    }

    const addResult = () => {
      $(".results-container").append(`<div class="result-item">
          <h2 class="result-title">
            <a class="result-link" href="${searchResults[0].url}">
              ${searchResults[0].title}
            </a>
          </h2>
          <p class="result-snippet">${searchResults[0].snippet}</p>
        </div>`);
      searchResults.shift();
    };

    const enterResult = (page) => {
      if (
        page.snippet.indexOf("#REDIRECT") +
          page.snippet.indexOf("#redirect") +
          page.title.indexOf("\ufffd") ===
          -3 &&
        (validProblem(page.title) || !$("#input-problemsonly").prop("checked"))
      ) {
        searchResults.push({
          url: `/wiki/index.php/${encodeURIComponent(underscores(page.title))}`,
          title: titleCleanup(page.title),
          snippet: page.snippet,
        });
      }
    };

    clickedTimes++;
    let clickedTimesThen = clickedTimes;
    clearProblem();

    let searchResults = [];
    let pageExists = false;
    let originalSearch = $("#input-search").val();
    let search = sanitize(originalSearch)
      .replace(/&quot;/g, `"`)
      .replace(/’/g, "'")
      .replace("#", "Problems/Problem ");
    search = search.charAt(0).toUpperCase() + search.slice(1);

    if (!search) {
      $(".notes").before(
        `<div class="problem-section">
          <h2 class="section-header" id="article-header">Error</h2>
          <p class="error">
            No search terms were entered.
          </p>
        </div>`
      );
    } else {
      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";

      let params = `action=parse&page=${encodeURIComponent(
        underscores(search)
      )}&format=json`;
      let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
      let json = await response.json();
      if (json?.parse) pageExists = true;

      params =
        `action=query&list=search&srwhat=text&srsearch=${search}` +
        `&srlimit=max&srqiprofile=wsum_inclinks_pv&format=json`;
      response = await fetch(`${apiEndpoint}?${params}&origin=*`);
      json = await response.json();

      if (clickedTimes === clickedTimesThen)
        for (let page of json.query.search) enterResult(page);

      while (json?.continue) {
        let paramsContinue = params + `&sroffset=${json.continue.sroffset}`;
        response = await fetch(`${apiEndpoint}?${paramsContinue}&origin=*`);
        json = await response.json();

        for (let page of json.query.search) enterResult(page);
      }
      console.log(searchResults);

      if (clickedTimes === clickedTimesThen) {
        addSearch();
        await addResults(originalSearch, search, searchResults, pageExists);

        document.title =
          `Search results for ${originalSearch}` +
          " - Linguist Grammar Reader";
        fixLinks();
        directLinks();
      }
    }
  });

  $(".page-container").on("click", "#theorem-button", async () => {
    if (!theoremPages[0]) {
      console.log("Loading theorems...");
      let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
      let params =
        `action=query&list=categorymembers&cmtitle=Category:Theorems` +
        `&cmlimit=max&format=json`;

      let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
      let json = await response.json();

      for (let page of json.query.categorymembers)
        theoremPages.push(page.title);
    }
    theoremPages = theoremPages.filter(
      (e) => e !== "H\ufffdlder's Inequality" && e !== "Theorems"
    );

    let randomTheorem =
      theoremPages[Math.floor(Math.random() * theoremPages.length)];
    console.log(randomTheorem);
    await addArticle(randomTheorem, true);
  });

  $(".page-container").on("click", "#history-button", async () => {
    async function addItems(history) {
      let resultsNum = history.length;
      let loadedTimes = 0;
      for (let i = 0; i < resultsNum && i < 10; i++) addItem();
      loadedTimes++;
      if (history.length)
        $(".results-container").after(
          `<button class="text-button" id="load-results">Load more…</button>`
        );

      $("#load-results").click(() => {
        for (let i = 0; i < resultsNum - loadedTimes * 10 && i < 10; i++)
          addItem();
        loadedTimes++;
        if (!history.length) $("#load-results").remove();

        directLinks();
      });
    }

    const addItem = () => {
      $(".results-container").append(`<div class="result-item">
          <h2 class="result-title">
            <a class="result-link" href="${history[0].url.replace(
              "https://artofproblemsolving.com",
              ""
            )}">
              ${history[0].title}
            </a>
          </h2>
          <p class="result-snippet">${history[0].snippet}...</p>
        </div>`);
      history.shift();
    };

    clearAll();
    activeButton("history-button");

    $("#main-button-container").after(`
      ${notes}`);
    renderChart();
    collapseNotes();

    let history = JSON.parse(localStorage.getItem("pageHistory"));

    if (!history) {
      $(".notes").before(
        `<div class="results-container">
        <div class="results-notice">No history yet…</div>
      </div>`
      );
    } else {
      console.log(history);

      addHistoryContainer();
      await addItems(history);

      document.title = "View history - Linguist Grammar Reader";
      fixLinks();
      directLinks();
      $("#clear-history").click(() => {
        localStorage.removeItem("pageHistory");

        $(".results-container").remove();
        $("#load-results").remove();
        $(".notes").before(
          `<div class="results-container">
            <div class="results-notice">No history yet…</div>
          </div>`
        );
      });
    }
  });

  // Replace problems
  async function replaceProblems(problems) {
    $(".replace-problem").click(async function () {
      async function replace() {
        let pageIndex;
        let randomPage;
        let newProblem;
        let giveUp = false;

        let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
        let params;
        let response;
        let json;

        while (!newProblem && !giveUp) {
          pageIndex = Math.floor(Math.random() * pages.length);
          randomPage = pages[pageIndex];
          console.log(randomPage);

          params = `action=parse&page=${randomPage}&format=json`;
          response = await fetch(`${apiEndpoint}?${params}&origin=*`);
          json = await response.json();

          let problemText = latexer(json.parse.text["*"]);
          let problemProblem = getProblem(problemText);
          let problemSolutions = getSolutions(problemText);

          if (problemProblem && problemSolutions) {
            newProblem = {
              title: randomPage,
              difficulty: computeDifficulty(
                computeTest(randomPage),
                computeNumber(randomPage),
                computeYear(randomPage)
              ),
              problem: problemProblem,
              solutions: problemSolutions,
            };

            problems.push(newProblem);
            pages.splice(pageIndex, 1);
          } else if (problemText.includes("Redirect to:")) {
            console.log("Redirect problem, going there instead...");

            let redirHref = $($.parseHTML(problemText))
              .find(".redirectText a")
              .attr("href");
            let redirPage = redirHref
              .replace("/wiki/index.php/", "")
              .replace(/_/g, " ");
            console.log(redirPage);

            params = `action=parse&page=${redirPage}&format=json`;
            response = await fetch(`${apiEndpoint}?${params}&origin=*`);
            json = await response.json();

            problemText = latexer(json.parse.text["*"]);
            problemProblem = getProblem(problemText);
            problemSolutions = getSolutions(problemText);

            newProblem = {
              title: randomPage,
              difficulty: computeDifficulty(
                computeTest(randomPage),
                computeNumber(randomPage),
                computeYear(randomPage)
              ),
              problem: problemProblem,
              solutions: problemSolutions,
            };

            problems.push(newProblem);
            pages.splice(pageIndex, 1);
          } else {
            console.log("Invalid problem, skipping...");
            pages.splice(pageIndex, 1);
            if (pages.length === 0) giveUp = true;
          }
          if (newProblem) {
            $(`#batch-text .article-problem:nth-child(${replacedIndex})`)
              .replaceWith(`<div class="article-problem"
                index="${replacedIndex}" difficulty="${newProblem.difficulty}">
                <h2 class="problem-heading">Problem ${replacedIndex}
                  <span class="source-link">
                    (<a class="source-link-a"
                      href="https://artofproblemsolving.com/wiki/index.php/${underscores(
                        newProblem.title
                      )}">${titleCleanup(newProblem.title)}</a>)
                  </span>${replaceButton}
                </h2>${newProblem.problem}
              </div>`);

            $(`#solutions-text .article-problem:nth-child(${replacedIndex})`)
              .replaceWith(`<div class="article-problem" 
                index="${replacedIndex}" difficulty="${newProblem.difficulty}">
                <h2 class="problem-heading">
                  Problem ${replacedIndex}
                  <span class="source-link">
                    (<a class="source-link-a"
                      href="https://artofproblemsolving.com/wiki/index.php/${underscores(
                        newProblem.title
                      )}">${titleCleanup(newProblem.title)}</a>)
                  </span>
                </h2>${newProblem.problem}
                <div class="solutions-divider">Solution</div>
                ${newProblem.solutions}
              </div>`);

            let problemsList = $("#copy-problems")
              .attr("data-clipboard-text")
              .split(", ");
            problemsList[replacedIndex - 1] = titleCleanup(newProblem.title);
            $("#copy-problems").attr(
              "data-clipboard-text",
              problemsList.join(", ")
            );

            katexFallback();
            $(".replace-problem").off("click");
            replaceProblems(problems);
            fixLinks();
            directLinks();
            hideLinks();
            breakSets();
          }
        }
      }
      let replacedProblem = $(this).closest(".article-problem");
      let replacedIndex = replacedProblem.attr("index");
      let replacedDifficulty = replacedProblem.attr("difficulty");

      let pages = await getPages();
      pages = pages.filter(
        (problem) => !problems.map((e) => e.title).includes(problem)
      );
      if ($("#input-sort").prop("checked"))
        pages = pages.filter(
          (problem) =>
            computeDifficulty(
              computeTest(problem),
              computeNumber(problem),
              computeYear(problem)
            ) == replacedDifficulty
        );

      console.log(`${pages.length} total problems retrieved.`);
      if (pages.length === 0)
        $(this).replaceWith(
          `<span class="replace-notice">No replacements found</span>`
        );
      else {
        await replace();
        console.log(problems);
        if (pages.length === 0)
          $(this).replaceWith(
            `<span class="replace-notice">No replacements found</span>`
          );
      }
    });
  }

  // Clear things
  function clearProblem() {
    $(".problem-section").remove();
    $(".results-container").remove();
    $("#load-results").remove();
  }

  function clearOptions() {
    document.title = "Linguist Grammar Reader";
    history.pushState(
      {},
      "Linguist Grammar Reader",
      location.href.split("?page=")[0]
    );
    lastParam = "";
    $(".options-input").remove();
    $(".error").remove();
    $(".problem-section").remove();
    $(".results-container").remove();
    $("#load-results").remove();
    $(".notes").remove();
  }

  function clearOptionsWithoutHistory() {
    $(".options-input").remove();
    $(".error").remove();
    $(".problem-section").remove();
    $(".results-container").remove();
    $("#load-results").remove();
    $(".notes").remove();
  }

  function clearAll() {
    document.title = "Linguist Grammar Reader";
    history.pushState(
      {},
      "Linguist Grammar Reader",
      location.href.split("?page=")[0]
    );
    lastParam = "";
    $("#secondary-button-container").remove();
    $(".options-input").remove();
    $(".error").remove();
    $(".problem-section").remove();
    $(".results-container").remove();
    $("#load-results").remove();
    $(".notes").remove();
  }

  // Active buttons
  function activeButton(buttonName) {
    $(".button").removeClass("button-active");
    $(`#${buttonName}`).addClass("button-active");
  }

  function activeSecondaryButton(buttonName) {
    $(".secondary-button").removeClass("secondary-button-active");
    $(`#${buttonName}`).addClass("secondary-button-active");
  }

  // Formatting
  function collapseNotes() {
    $("#notes-header").click(() => {
      $(".notes").toggleClass("notes-collapsed");
    });
  }

  function customText() {
    if (JSON.parse(localStorage.getItem("serifFont")))
      $(".article-text").addClass("serif-text");

    if (JSON.parse(localStorage.getItem("justifyText")))
      $(".article-text").addClass("justify-text");

    if (!JSON.parse(localStorage.getItem("mathJaxDisabled"))) {
      $(".article-text").addClass("katex-text");
    } else {
      $(".article-text").removeClass("katex-text");
    }
  }

  function changeName() {
    let name = $("#input-name").val();
    if (name) {
      $("#batch-header").html(sanitize(name));
      document.title = sanitize(name) + " - Linguist Grammar Reader";
    } else {
      document.title = "Problem Batch - Linguist Grammar Reader";
    }
  }

  function nameLive() {
    $("#input-name").change(() => {
      changeName();
    });
  }

  function katexFallback() {
    $(".katex-error, .text[style='color:#cc0000;']").each(function () {
      $(this).closest(".katex-container").addClass("katex-broken");
      $(this)
        .closest(".katex-container")
        .prev(".fallback-container")
        .addClass("fallback-live");
    });
  }

  function fixLinks() {
    $("a").each(function () {
      let href = $(this).attr("href")?.split("#")[0];
      if (href && /^\/wiki\/index\.php\//.test(href)) {
        if (JSON.parse(localStorage.getItem("tabLinksExternal")))
          $(this).attr({
            href: `https://artofproblemsolving.com${href}`,
            title: "",
          });
        else
          $(this).attr({
            href: href.replace("/wiki/index.php/", "?page="),
            title: "",
          });
      }
    });

    $("a.image").each(function () {
      $(this).removeAttr("href");
    });
  }

  async function directLinks() {
    $("a:not(#aops-wiki-link):not(.aops-link)").off("click");
    $("a:not(#aops-wiki-link):not(.aops-link)").click(async function (event) {
      let href = $(this).attr("href");
      if (
        href &&
        (href.includes("artofproblemsolving.com/wiki/") ||
          href.includes("?page="))
      ) {
        event.preventDefault();
        let pagename = decodeURIComponent(
          href
            .replace("https://artofproblemsolving.com/wiki/index.php/", "")
            .replace(/^\?page=/g, "")
            .replace(/_/g, " ")
            .replace(/%/g, "%25")
        ).replace(/%2F/g, "/");
        clearProblem();
        console.log(pagename);
        if (validProblem(pagename)) await addProblem(pagename, true);
        else await addArticle(pagename, true);
      }
    });
  }

  function hideLinks() {
    if ($("#input-hide").prop("checked"))
      $("#batch-text .source-link").addClass("noprint");
    else $("#batch-text .source-link").removeClass("noprint");
  }

  function hideToggle() {
    $("#input-hide").change(() => {
      $("#batch-text .source-link").toggleClass("noprint");
    });
  }

  function collapseSolutions() {
    $("#solutions-header").off("click");
    $("#solutions-header").click(() => {
      $("#solutions-section").toggleClass("section-collapsed");
      $("#input-answer").prop("disabled", true);
      if (
        $(".answer-check").length &&
        !$(".correct-feedback").length &&
        !progressUpdated
      ) {
        $(".progress-hidden").removeClass("progress-hidden");
        $(".progress-nobottom").removeClass("progress-nobottom");
        progressUpdated = true;
        if (answerTries > 0) {
          $(".question-bar.wrong-questions").removeClass("bar-hidden");
          $(".question-bar.wrong-questions").css(
            "flex-grow",
            parseInt($(".question-bar.wrong-questions").css("flex-grow")) + 1
          );
          $("#wrong-num").text(
            parseInt($(".question-bar.wrong-questions").css("flex-grow"))
          );
        } else {
          $(".question-bar.blank-questions").removeClass("bar-hidden");
          $(".question-bar.blank-questions").css(
            "flex-grow",
            parseInt($(".question-bar.blank-questions").css("flex-grow")) + 1
          );
          $("#blank-num").text(
            parseInt($(".question-bar.blank-questions").css("flex-grow"))
          );
        }
      }
    });
  }

  function breakSets() {
    let breakNum = $("#input-break").val();
    if (breakNum) {
      $(`.article-problem`).css("break-after", "");
      $(`.article-problem:nth-child(${breakNum}n)`).css("break-after", "page");
    } else $(`.article-problem`).css("break-after", "");
  }

  function breakLive() {
    $("#input-break").change(() => {
      breakSets();
    });
  }

  // Insert chart
  function renderChart() {
    const options = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",

      description: "A simple bar chart with ranged data (aka Gantt Chart).",
      data: {
        values: [
          {
            Test: "AMC 8",
            "Start difficulty": 0.25,
            "End difficulty": 2,
            Level: "Introductory",
          },
          {
            Test: "AMC 10",
            "Start difficulty": 1,
            "End difficulty": 4.5,
            Level: "Intermediate",
          },
          {
            Test: "AMC 12",
            "Start difficulty": 1.25,
            "End difficulty": 5.5,
            Level: "Intermediate",
          },
          {
            Test: "AHSME",
            "Start difficulty": 1,
            "End difficulty": 5.5,
            Level: "Intermediate",
          },
          {
            Test: "AIME",
            "Start difficulty": 3,
            "End difficulty": 6.5,
            Level: "Intermediate",
          },
          {
            Test: "USAJMO",
            "Start difficulty": 4,
            "End difficulty": 7,
            Level: "Olympiad",
          },
          {
            Test: "USAMO",
            "Start difficulty": 4,
            "End difficulty": 8.5,
            Level: "Olympiad",
          },
          {
            Test: "IMO",
            "Start difficulty": 4,
            "End difficulty": 9.5,
            Level: "Olympiad",
          },
        ],
      },
      mark: "bar",
      encoding: {
        y: {
          field: "Test",
          type: "ordinal",
          sort: { order: null },
          axis: { titleFontSize: 14, labelFonFtSize: 13 },
        },
        x: {
          field: "Start difficulty",
          type: "quantitative",
          axis: {
            tickMinStep: 1,
            titleFontSize: 14,
            labelFontSize: 13,
            title: "Difficulty",
          },
        },
        x2: { field: "End difficulty" },
        color: {
          type: "nominal",
          field: "Level",
          scale: {
            domain: ["Introductory", "Intermediate", "Olympiad"],
            range: ["#f58518", "#4c78a8", "#e45756"],
          },
          sort: { order: null },
          legend: {
            titleFontSize: 14,
            labelFontSize: 13,
          },
        },
      },

      width: "container",
      height: 200,
      background: null,
      config: {
        font: "'Latin Modern Sans', sans-serif",
      },
    };

    vegaEmbed("#difficulty-chart", options, {
      actions: false,
      renderer: "svg",
    });
  }

  // Enter pages into history
  function addHistory(page, snippet) {
    let history = JSON.parse(localStorage.getItem("pageHistory"));
    let url = `https://artofproblemsolving.com/wiki/index.php/${encodeURIComponent(
      underscores(page)
    )}`;
    let cleanedPage = titleCleanup(page);
    let sanitizedSnippet = sanitize(snippet);

    if (history)
      history.unshift({
        url: url,
        title: cleanedPage,
        snippet: sanitizedSnippet,
      });
    else
      history = [
        {
          url: url,
          title: cleanedPage,
          snippet: sanitizedSnippet,
        },
      ];
    if (history.length > 50) history.pop();
    history = [...new Map(history.map((item) => [item.title, item])).values()];

    localStorage.setItem("pageHistory", JSON.stringify(history));
  }

  function addHistoryBatch(problems, snippet, title) {
    let history = JSON.parse(localStorage.getItem("pageHistory"));
    let url = `?problems=${underscores(problems.join("|"))}`;
    let cleanedPage =
      title ??
      problems
        .map((e) => titleCleanup(e))
        .join(", ")
        .substring(0, 40) + "...";
    let sanitizedSnippet = sanitize(snippet);

    if (history)
      history.unshift({
        url: url,
        title: cleanedPage,
        snippet: sanitizedSnippet,
      });
    else
      history = [
        {
          url: url,
          title: cleanedPage,
          snippet: sanitizedSnippet,
        },
      ];
    if (history.length > 50) history.pop();
    history = [...new Map(history.map((item) => [item.title, item])).values()];

    localStorage.setItem("pageHistory", JSON.stringify(history));
  }

  // Show article/batch if query
  (async () => {
    if (searchParams.get("page")) {
      $("#main-button-container").after(`${notes}`);
      renderChart();
      collapseNotes();

      if (validProblem(lastParam)) await addProblem(lastParam, true);
      else await addArticle(lastParam, true);
    } else if (searchParams.get("problems")) {
      $("#main-button-container").after(`${notes}`);
      renderChart();
      collapseNotes();

      addUrlBatch();
      await fillBatch(lastParam, true);
    }

    window.onpopstate = async (event) => {
      let newPagename = event.state?.page;
      let newProblems = event.state?.problems;
      console.log(newProblems);

      if (newPagename && newPagename !== searchParams.get("page")) {
        if ($(".notes").length === 0) {
          if ($("#secondary-button-container").length === 0)
            $("#main-button-container").after(`${notes}`);
          else $("#secondary-button-container").after(`${notes}`);
          renderChart();
          collapseNotes();
        }

        clearProblem();
        if (validProblem(newPagename)) await addProblem(newPagename, false);
        else await addArticle(newPagename, false);
        lastParam = newPagename;
      } else if (newProblems && newProblems !== searchParams.get("problems")) {
        console.log("Hi");
        clearOptionsWithoutHistory();
        $("#main-button-container").after(`${notes}`);
        renderChart();
        collapseNotes();

        addUrlBatch();
        await fillBatch(newProblems, false);
        lastParam = newProblems;
      }
    };
  })();

  // Bonus
  $(".header").click(() => {
    $(".trivial-logo").show();
  });

  $(".subtitle").click(() => {
    subtitleClicked++;
    let text;
    switch (subtitleClicked % 7) {
      case 0:
        text = "An AoPS Wiki Reader for Studying & Practicing";
        break;
      case 1:
        text = "Alcumus, but you don’t get internet points";
        break;
      case 2:
        text = "Brilliant, but you don’t learn anything useful";
        break;
      case 3:
        text = "Wikiwand, but you don’t get ads everywhere";
        break;
      case 4:
        text = "A web browser, but you can only use AoPS";
        break;
      case 5:
        text = "A side project, but why didn’t I just use React.js";
        break;
      case 6:
        text =
          "The AoPS Wiki, but you waste time trying to find the other easter eggs";
        break;
    }
    $(".subtitle").html(text);
  });
})();
