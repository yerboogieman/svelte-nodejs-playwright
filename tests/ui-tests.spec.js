// Test 1 - Update click test

const {test, expect} = require('@playwright/test'); // required test and expect from playwright
test('verify fields after clicking update button', async ({page}) => {


    await page.goto('http://192.168.1.2:8080'); // navigate to the web page

    await page.waitForTimeout(3000);

    await page.click('//ul//button[.="Update"]');

    await page.waitForTimeout(4000);

    const actualFirstName = await page.inputValue('//input[@placeholder="First Name"]');
    const actualLastName = await page.inputValue('//input[@placeholder="Last Name"]');
    const actualAge = await page.inputValue('//input[@placeholder="Age"]');
    const actualCity = await page.inputValue('//input[@placeholder="City"]');
    const actualState = await page.inputValue('//input[@placeholder="State"]');

    const actualConcatenatedValues = `${actualFirstName} ${actualLastName}, ${actualAge}, ${actualCity}, ${actualState}`;

    const expectedConcatenatedValues = await page.textContent('span');

    expect(actualConcatenatedValues).toBe(expectedConcatenatedValues);

});
