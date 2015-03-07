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
package minium.web.internal.compressor;

import minium.web.internal.ResourceException;

import java.io.Closeable;
import java.io.IOException;
import java.io.Reader;
import java.net.URL;

import com.google.common.base.Charsets;
import com.google.common.base.Function;
import com.google.common.io.Closeables;
import com.google.common.io.Resources;
import com.google.javascript.jscomp.SourceFile;

public class ResourceFunctions {

    private static class ClasspathFileToSourceFileFunction implements Function<String, SourceFile> {

        private final ClassLoader classLoader;

        public ClasspathFileToSourceFileFunction(ClassLoader classLoader) {
            this.classLoader = classLoader;
        }

        @Override
        public SourceFile apply(String filePath) {
            Reader reader = null;
            try {
                URL resource = classLoader.getResource(filePath);
                reader = Resources.asCharSource(resource, Charsets.UTF_8).openStream();
                return SourceFile.fromReader(filePath, reader);
            } catch (IOException e) {
                throw new ResourceException(e);
            } finally {
                closeQuietly(reader);
            }
        }
    }

    private static class ClasspathFileToStringFunction implements Function<String, String> {

        private final ClassLoader classLoader;

        public ClasspathFileToStringFunction(ClassLoader classLoader) {
            this.classLoader = classLoader;
        }

        @Override
        public String apply(String filePath) {
            try {
                URL resource = classLoader.getResource(filePath);
                return Resources.toString(resource, Charsets.UTF_8);
            } catch (IOException e) {
                throw new ResourceException(e);
            }
        }
    }

    public static Function<String, SourceFile> classpathFileToSourceFileFunction(ClassLoader classLoader) {
        return new ClasspathFileToSourceFileFunction(classLoader);
    }

    public static Function<String, String> classpathFileToStringFunction(ClassLoader classLoader) {
        return new ClasspathFileToStringFunction(classLoader);
    }

    private static void closeQuietly(Closeable closeable) {
        try {
            Closeables.close(closeable, true);
        } catch (IOException e) {
            // it will never get here
        }
    }
}