# General Concepts

In this chapter we will explain the general concepts behind Minium, and why yet another 
selenium framework.

## History

First, a little bit of history.

Minium was created in 2011 by Rui Figueira as a Java library on top of selenium WebDriver with
two purposes:

* Mimic [jQuery](http://jquery.com/) API using [Selenium WebDriver API](http://docs.seleniumhq.org/projects/webdriver/)
* Allow method chaining when filtering / transversing the page DOM 
* Avoid tipical errors that occur with Selenium (like `StaleElementReferenceException`)

Back in those days, WebDriver support for CSS selector was very poor under most browsers, and XPath was not an
option whatsoever (c'mon, XPath on the Web, really?!), and after trying to replicate jQuery API using WebDriver 
API calls (which were very inefficient, because each method needed to communicate with the browser to get the 
corresponding elements), we found out that we could use WebDriver `JavascriptExecutor` to send javascruipt 
instructions to the browser and get both data and element references. That gave us an idea: why not sending 
jQuery to the browser and then use it to access web elements instead?
That was what we did, and that gave Minium a huge power:

* Almost all jQuery-supported CSS selectors and methods are now supported by Minium
* Allowing method chaining was as easy as make Minium API lazy, and every method would just concatenate
  the equivalent jQuery instruction
* By only evaluating a Minium instruction when it was needed (when we needed to click something or get a value),
  the probability of getting a `StaleElementReferenceException` was almost 0. Besides, Minium instructions are not 
  binded to `WebElement` elements, so you can evaluate the same instruction two different times and get different
  values if the page has changed

## Elements / WebElements

`Elements` is the most important concept in Minium. It represents an instruction (from now on, we'll call 
them `Minium expressions`) that will eventually evaluate into elements that we want to interact with. Notice that
we didn't say web elements, because currently Minium can be extended to other test platforms, 
even non-Web ones like mobile or visual pattern recognition ones like [Sikuli](http://sikuli.org/)).

`Elements` are normally lazy (there are some exceptions), and they can be evaluated several times with different
results, which means that the same `Minium expression` can be reused. Besides, its chainable method API always returns
a new `Ninium expression`, so `Minium expressions` are by nature immutable.

Minium `WebElements` is a specialization of `Elements` for browser testing (it is intentionally the plural of Selemiun
WebDriver `WebElement`). It uses Selenium WebDriver API under the hood.

Consider the following Minium expression:

```javascript
searchbox = $("#container").find(":text").filter("[name=searchbox]");
```

That expression itself does not communicate with the browser, because it was not evaluated yet. For an expression 
to be evaluated, one of the following invocations need to occur:

* A method with a return value other than a subclass of `Elements` is invoked, like:
```javascript
searchbox.text();
```
* An interaction method is called:
```javascript
searchbox.fill("Minium can!");
```
### Under the hood

Let's see what happens under the hood when the following code is executed:

```javascript
searchbox = $("#container").find(":text").filter("[name=searchbox]");
searchbox.text()
```

- Minium expression `$("#container").find(":text").filter("[name=searchbox]")`, which chains methods
  `.find(selector)` and `.filter(selector)` returns a `WebElements` object that only maintains that same expression
 internally. At this point, no communication with the browser occured yet.
- When `.text()` method is called, which returns a `String`, then the expression needs to evaluated. At this time,
  Minium generates javascript code for evaluating the corresponding jquery expression. This javascript code
  is then sent to the browser and it will try to find the object `minium.jQuery` in the page scope:
    1. in case it exists, `minium.jQuery` will be used to evaluate the expression and the corresponding value is returned
    2. in case it doesn't exist, Minium is notified and it then generates a different javascript code that
      includes all jQuery code plus some extensions needed, as well as the same code as before. This script will be responsible
      for, first of all, initialize `minium` object in the page scope (with a custom jQuery version in `minium.jQuery`), and
      then it evaluates the same expression as `1.`. That means that an additional communication with the browser is made.

## Interactions

Interactions are another key concept in Minium. They represent user interactions with the browser, like
cllicking, filling input fields, or even waiting that some element exists.

Also, interactions have a very important behaviour: **they try the best they can to fulfill their task**.
For instance, let's say we have the following expression:

```javascrippt
field = $(":text").unless(".loading");
```

This expression represents all text input elements in the page **unless** there is some element with
`loading` CSS class (in that case, it will then evaluate to an empty set).

Now let's try to interact with it:

```javascript
field.fill("Minium can!");
```

At this point, we have an interaction being called, and for that reason Minium will evaluate `field`.
If there is some `.loading` element in the page (for instance, some AJAX is being performed and the page
displays a loading element to let us know that), then `field` will evaluate to an empty set, and for that
reason, it cannot be filled with text. At this point, Minium will wait a specified `interval` period and then 
retry the evaluation. Two situations may occur:

- Eventually, the expression evaluates to a non-empty set. Minium will then grab the first element of that
  evaluated set and will fill it with the specified text.
- the expression keeps evaluating to an empty set, and the total period surpasses a specified `timeout` period.
  At this point, interaction is aborted and a `TimeoutException` is thrown.

### Wait Interactions

`WaitInteraction`s are a slightly different kind of interactions, first of all because they don't actually 
change state in the browser. Besides, normally a `Interaction` can only fulfill their task when the expression
evaluates at least one element, but there are two `WaitInteraction` (`.checkForUnexistence()` and `.waitForUnexistence()`)
that are only able to fulfill their task when it evaluates to an empty set.

The following `WaitInteraction`s exist:

- `.waitforExistence( [waitingPreset] )`: waits until the expression evaluates to at least one element, and returns that expression
- `.waitforUnexistence( [waitingPreset] )`: waits until the expression evaluates to no element at all, and returns that expression
- `.checkForExistence( [waitingPreset] )`: tries to wait until the expression evaluates to at least one element, returning true.
  In case a timeout occurs, it will return false
- `.checkForExistence( [waitingPreset] )`: tries to wait until the expression evaluates to no element at all, returning true.
  In case a timeout occurs, it will return false
- `.waitTime(time, units)`: waits a specified ammout of time, returning the expression after that time has passed

Notice that an `waitingPreset` can be provided, which is a `String` that represents a pair of `interval` and `timeout` periods. 
That can be configured globaly, as well as the default `interval` and `timeout` periods. By default, there is a `immediate` waiting
preset that doesn't wait at all (for instance, `$(:text).checkForExistence("immediate")` will return true or false immediately).

**Very Important:** having `$(":text").checkForUnexistence()` is not the same as `!$(:text).checkForExistence()`, because
in the first one, it will wait until `$("text")` evaluates to an empty set, and in the second one it will wait for
`$("text")` to evaluate to a non-empty set. Don't forget that **an interaction always tries to fulfill its task**,
and for `.checkForExistence()` / `.checkForUnexistence()` that means returning true!

## One Elements, one Interaction

The reason for this behaviour is that we want Minium code to be as straighforward as possible.