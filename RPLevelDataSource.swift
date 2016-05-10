//
//  RPLevelDataSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

protocol RPLevelDataSource: class {
    
    func levelLayers() -> [RPLevelLayer]
    var loadableTypes: [RPResourceLoadableType.Type] { get }
    func demoPattern() -> RPPattern
}