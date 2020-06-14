describe("Systemtest", () => {
    it("should change URL when searching", () => {
        cy.visit("localhost:5000/");
        cy.get("#landingInput").type("Turdus merula");
        cy.get("#landingSubmit").click();
        cy.url().should("include", "search/Turdus_merula")
    })
    it("should show the infobox upon hovering an image and hide it when leaving", () => {
        cy.visit("localhost:5000/#/search/Turdus_merula");
        cy.get(":nth-child(1) > .image").trigger("mouseenter");
        cy.get("#infobox").should("be.visible");
        cy.get(":nth-child(1) > .image").trigger("mouseleave");
        cy.get("#infobox").should("not.be.visible");
    })
})
