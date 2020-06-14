import "@testing-library/jest-dom/extend-expect";
import { render, cleanup, fireEvent } from "@testing-library/svelte";
import LandingPage from "../src/Components/LandingPage.svelte";
import { routing } from "../src/Modules/routing.js";

afterEach(cleanup);

describe("LandingPage", () => {
    it("should be rendered", async () => {
        const result = render(LandingPage);
        expect(result).toBeTruthy();
    });
    it("should have an input field", () => {
        render(LandingPage);
        expect(document.querySelector("#landingInput")).toBeTruthy();
    })
    it("should call the correct URL on submit", async () => {
        render(LandingPage);
        const spy = jest.spyOn(routing, "changeTo");
        fireEvent.input(document.querySelector("#landingInput"), {target: {value: "test input"}});
        await fireEvent.click(document.querySelector("#landingSubmit"));
        expect(spy).toHaveBeenCalledWith("/search/test_input");
        spy.mockRestore();
    })
})
