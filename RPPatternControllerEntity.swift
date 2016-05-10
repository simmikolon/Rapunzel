//
//  RPPatternControllerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPatternControllerEntity: RPEntity {

    let patternControllerComponent: RPPatternControllerComponent
    
    init(withLayerEntity layerEntity: RPLayerEntity, pattern: RPPattern, entityManagerComponent: RPEntityManagerComponent) {
        
        patternControllerComponent = RPPatternControllerComponent(withLayerEntity: layerEntity, pattern: pattern, entityManagerComponent: entityManagerComponent)
        
        super.init()
        
        addComponent(patternControllerComponent)
    }
}
