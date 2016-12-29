//
//  LevelDataSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

protocol LevelDataSource: class {
    
    func levelLayers() -> [LevelLayer]
    var loadableTypes: [ResourceLoadableType.Type] { get }
    func demoPattern() -> Pattern
}