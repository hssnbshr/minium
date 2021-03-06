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
package minium.web.actions;

import java.util.Date;

public interface Cookie {

    String getName();

    String getValue();

    String getDomain();

    String getPath();

    boolean isSecure();

    boolean isHttpOnly();

    Date getExpiry();

    public static class Builder {
        private final String name;
        private final String value;
        private String path;
        private String domain;
        private Date expiry;
        private boolean secure;
        private boolean httpOnly;

        public Builder(String name, String value) {
            this.name = name;
            this.value = value;
        }

        public Cookie.Builder domain(String host) {
            this.domain = host;
            return this;
        }

        public Cookie.Builder path(String path) {
            this.path = path;
            return this;
        }

        public Cookie.Builder expiresOn(Date expiry) {
            this.expiry = expiry;
            return this;
        }

        public Cookie.Builder isSecure(boolean secure) {
            this.secure = secure;
            return this;
        }

        public Cookie.Builder isHttpOnly(boolean httpOnly) {
            this.httpOnly = httpOnly;
            return this;
        }

        public Cookie build() {
            return new Cookie() {
                @Override
                public String getName() {
                    return name;
                }

                @Override
                public String getValue() {
                    return value;
                }

                @Override
                public String getDomain() {
                    return domain;
                }

                @Override
                public String getPath() {
                    return path;
                }

                @Override
                public boolean isSecure() {
                    return secure;
                }

                @Override
                public boolean isHttpOnly() {
                    return httpOnly;
                }

                @Override
                public Date getExpiry() {
                    return expiry;
                }
            };
        }
    }
}