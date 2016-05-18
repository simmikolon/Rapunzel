//
//  CameraLayer.swift
//  Rapunzel
//
//  Created by Simon Kemper on 31.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class CameraLayerEntity: LayerEntity {

    let cameraComponent: CameraComponent
    
    init(withParallaxFactor factor: CGFloat = 1.0, focusedNode node: Node) {
        cameraComponent = CameraComponent(focusedNode: node)
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent)
        addComponent(cameraComponent)
        self.renderComponent.addChild(cameraComponent.cameraNode)
        self.name = "CameraLayerEntity"
    }
}
