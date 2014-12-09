package cucumber.runtime.rest.dto;

import gherkin.I18n;
import gherkin.formatter.Argument;
import gherkin.formatter.model.Step;

import java.io.Serializable;
import java.lang.reflect.Type;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonAutoDetect;

import cucumber.runtime.ParameterInfo;
import cucumber.runtime.StepDefinition;
import cucumber.runtime.rest.RemoteBackend;

@JsonAutoDetect(
        getterVisibility = JsonAutoDetect.Visibility.NONE,
        setterVisibility = JsonAutoDetect.Visibility.NONE,
        fieldVisibility = JsonAutoDetect.Visibility.ANY
)
public class StepDefinitionDTO implements StepDefinition, Serializable {

    private static final long serialVersionUID = 1195844972068596887L;

    private UUID glueId;
    private long id;
    private String pattern;
    private Integer parameterCount;
    private String location;
    private String detailedLocation;

    private transient RemoteBackend remoteBackend;

    public StepDefinitionDTO() {
    }

    public StepDefinitionDTO(UUID glueId, long id, StepDefinition stepDefinition) {
        this.glueId = glueId;
        this.id = id;
        this.pattern = stepDefinition.getPattern();
        this.parameterCount = stepDefinition.getParameterCount();
        this.location = stepDefinition.getLocation(false);
        this.detailedLocation = stepDefinition.getLocation(true);
    }

    public UUID getGlueId() {
        return glueId;
    }

    public void setGlueId(UUID glueId) {
        this.glueId = glueId;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setRemoteBackend(RemoteBackend remoteBackend) {
        this.remoteBackend = remoteBackend;
    }

    @Override
    public List<Argument> matchedArguments(Step step) {
        return remoteBackend.matchedArguments(this, step);
    }

    @Override
    public String getLocation(boolean detail) {
        return detail ? detailedLocation : location;
    }

    @Override
    public Integer getParameterCount() {
        return parameterCount;
    }

    @Override
    public ParameterInfo getParameterType(int n, Type argumentType) throws IndexOutOfBoundsException {
        // this logic will happen on the server side, here is ok to just return null and
        // not infer parameter types
        return null;
    }

    @Override
    public void execute(I18n i18n, Object[] args) throws Throwable {
        remoteBackend.execute(this, i18n, args);
    }

    @Override
    public boolean isDefinedAt(StackTraceElement stackTraceElement) {
        return false;
    }

    @Override
    public String getPattern() {
        return pattern;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }
}
