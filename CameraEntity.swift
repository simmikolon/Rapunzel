//
//  CameraEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 01.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class CameraEntity: Entity {

    let cameraComponent: CameraComponent
    let renderComponent: RenderComponent
    
    init(withFocusedNode node: Node) {

        cameraComponent = CameraComponent(focusedNode: node)
        renderComponent = RenderComponent()
        
        super.init()
        
        addComponent(cameraComponent)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
