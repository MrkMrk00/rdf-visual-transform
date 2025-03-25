package app.util;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;

import io.carml.engine.function.FnoFunction;
import io.carml.engine.function.FnoParam;

public class RmlFunctions {
    private List<Map<String, Object>> jsonData;

    public RmlFunctions(String jsonData) {
        try {
            this.jsonData = new ObjectMapper().readValue(jsonData, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (JsonMappingException e) {
        } catch (JsonProcessingException e) {
        }
    }

    @FnoFunction("http://example.org/lookupObject")
    public String lookupObject(
            @FnoParam("http://example.org/paramIri") String iri,
            @FnoParam("http://example.org/paramLookup") String lookup) {

        var foundObject = this.jsonData.stream()
                .filter(object -> object.get("@id").equals(iri))
                .findFirst();

        if (!foundObject.isPresent()) {
            return null;
        }

        return JsonPath.read(foundObject.get(), lookup);
    }
}
