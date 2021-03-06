/*
 * Copyright (C) 2015 The Minium Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package minium.web.internal.actions;

import static org.mockito.Mockito.spy;

import org.junit.Before;
import org.openqa.selenium.interactions.Keyboard;
import org.openqa.selenium.interactions.Mouse;

import minium.web.CoreWebElements.DefaultWebElements;
import minium.web.actions.WebDriverBrowser;
import minium.web.internal.drivers.MockWebDriver;
import minium.web.internal.drivers.MockWebElement;

public class BaseInteractableTest {

    private MockWebDriver mockedWebDriver;
    protected MockWebElement mockedWebElement;
    private WebDriverBrowser<DefaultWebElements> browser;
    protected DefaultWebElements interactable;
    protected Mouse mouse;
    protected Keyboard keyboard;

    public BaseInteractableTest() {
        super();
    }

    @Before
    public void setup() {
        mockedWebDriver = spy(new MockWebDriver());
        mockedWebElement = spy(new MockWebElement(mockedWebDriver));
        browser = new WebDriverBrowser<>(mockedWebDriver, DefaultWebElements.class);

        interactable = browser.root().find("input");
        mouse = mockedWebDriver.getMouse();
        keyboard = mockedWebDriver.getKeyboard();

        mockedWebDriver.when(interactable).thenReturn(mockedWebElement);
    }
}