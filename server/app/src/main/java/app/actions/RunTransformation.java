package app.actions;

import java.io.ByteArrayInputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.jetbrains.annotations.NotNull;

import io.carml.engine.rdf.RdfRmlMapper;
import io.carml.logicalsourceresolver.JsonPathResolver;
import io.carml.util.RmlMappingLoader;
import io.carml.vocab.Rdf;
import io.javalin.http.Context;
import io.javalin.http.Handler;

public class RunTransformation implements Handler {
    private final static String DUMMY_BASE_IRI = "http://dummy-url-that-no-one-should-use.af/dummy#";

    static class Request {
        public String mapping;
        public String graph;
    }

    private SimpleValueFactory valueFactory;

    public RunTransformation() {
        this.valueFactory = SimpleValueFactory.getInstance();
    }

    @Override
    public void handle(@NotNull Context ctx) throws Exception {
        Request request;

        try {
            request = ctx.bodyAsClass(Request.class);
        } catch (Exception e) {
            ctx.status(400).result("Invalid request body (" + e.getMessage() + ")");

            return;
        }

        RdfRmlMapper mapper;

        try {
            var mapping = RmlMappingLoader.build().load(RDFFormat.TURTLE,
                    new ByteArrayInputStream(request.mapping.getBytes()));

            mapper = RdfRmlMapper.builder()
                    .triplesMaps(mapping)
                    .baseIri(DUMMY_BASE_IRI)
                    .setLogicalSourceResolver(Rdf.Ql.JsonPath, JsonPathResolver::getInstance)
                    .build();

        } catch (Exception e) {
            ctx.status(400).result("Invalid mapping file (" + e.getMessage() + ")");

            return;
        }

        Set<Statement> model;

        try {
            var stmts = mapper.map(new ByteArrayInputStream(request.graph.getBytes(StandardCharsets.UTF_8)));

            model = stmts.map(this::replaceDummyBaseIri).collect(Collectors.toSet()).block();
        } catch (Exception e) {
            ctx.status(400).result("Error while transforming the graph (" + e.getMessage() + ")");

            return;
        }

        Rio.write(model, ctx.res().getOutputStream(), RDFFormat.NTRIPLES);
    }

    private <TValue extends Value> TValue replaceDummyBaseIri(TValue objectOrSubject) {
        if (objectOrSubject instanceof IRI iri && iri.stringValue().contains(DUMMY_BASE_IRI)) {
            var newIri = URLDecoder.decode(iri.stringValue().replace(DUMMY_BASE_IRI, ""), StandardCharsets.UTF_8);

            @SuppressWarnings("unchecked")
            var iriInstance = (TValue) this.valueFactory.createIRI(newIri);

            return iriInstance;
        }

        return objectOrSubject;
    }

    private Statement replaceDummyBaseIri(Statement stmt) {
        return this.valueFactory.createStatement(
                this.replaceDummyBaseIri(stmt.getSubject()),
                this.replaceDummyBaseIri(stmt.getPredicate()),
                this.replaceDummyBaseIri(stmt.getObject()),
                this.replaceDummyBaseIri(stmt.getContext()));
    }
}
