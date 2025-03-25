package app;

import app.actions.RunTransformation;
import io.javalin.Javalin;

public class Main {
    private static final int DEFAULT_PORT = 3000;

    public static void main(String args[]) {
        Javalin app = Javalin.create();
        app.get("/", ctx -> ctx.result("Ahoj"));
        app.post("/transform", new RunTransformation());

        System.out.println("Starting server on port " + DEFAULT_PORT);
        app.start(DEFAULT_PORT);
    }
}
